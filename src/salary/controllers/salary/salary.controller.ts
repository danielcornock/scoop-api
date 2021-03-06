import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/guards/auth/auth.guard';
import { UserSettingsService } from 'src/auth/services/user-settings/user-settings.service';
import { UserId } from 'src/common/decorators/user-id.decorator';
import { HttpResponse } from 'src/common/interfaces/http-response.interface';
import { salaryFields } from 'src/salary/constants/salary-fields.constant';
import { ISalaryMeta } from 'src/salary/interfaces/salary-meta.interface';
import { Salary } from 'src/salary/schemas/salary.schema';
import { SalaryPredictionService } from 'src/salary/services/salary-prediction/salary-prediction.service';
import { SalaryService } from 'src/salary/services/salary/salary.service';
import { DuplicateSalaryRequest } from 'src/salary/transfer-objects/duplicate-salary-request.dto';
import { GrossSalaryPrediction } from 'src/salary/transfer-objects/gross-salary-prediction.dto';
import { SalaryCreateRequest } from 'src/salary/transfer-objects/salary-create-request.dto';

@Controller('salary')
@UseGuards(AuthGuard)
export class SalaryController {
  constructor(
    private readonly _salaryPredictionService: SalaryPredictionService,
    private readonly _salaryService: SalaryService,
    private readonly _userSettingsService: UserSettingsService
  ) {}

  @Post('gross')
  public async getSalaryFormPredictions(
    @Body() body: GrossSalaryPrediction,
    @UserId() user: string
  ): HttpResponse<Partial<Salary>> {
    const data = await this._salaryPredictionService.getSalaryReductionPredictions(
      body,
      user
    );

    return { data };
  }

  @Post('duplicate')
  public async createSameSalaryAsLastMonth(
    @Body() body: DuplicateSalaryRequest,
    @UserId() user: string
  ): HttpResponse<Salary> {
    const latestEntry:
      | Salary
      | undefined = await this._salaryService.getLatestEntry(user);

    const formattedLatestEntry = latestEntry?.toObject();

    if (!formattedLatestEntry) {
      throw new BadRequestException(
        'You do not have any existing entries that you can duplicate!'
      );
    }

    delete formattedLatestEntry._id;

    const data = await this._salaryService.createLogEntry(
      {
        ...formattedLatestEntry,
        date: body.date
      },
      user
    );

    return { data };
  }

  @Get()
  public async getAll(
    @UserId() userId: string
  ): HttpResponse<Salary[], ISalaryMeta> {
    const [data, preferredCurrency, summaryItems] = await Promise.all([
      this._salaryService.getAllSorted(userId),
      this._userSettingsService.getPreferredCurrency(userId),
      this._salaryService.getSalarySummaryItems(userId)
    ]);

    const meta = {
      preferredCurrency,
      fields: salaryFields,
      summaryItems,
      latestDeductions: this._salaryService.extractLatestDeductions(data)
    };

    return { data, meta };
  }

  @Delete('/:salaryDate')
  public deleteOne(
    @UserId() user: string,
    @Param('salaryDate') date: string
  ): Promise<void> {
    return this._salaryService.deleteOne(user, date);
  }

  @Post()
  public async createSalaryLog(
    @Body() body: SalaryCreateRequest,
    @UserId() userId: string
  ): HttpResponse<Salary> {
    const data = await this._salaryService.createLogEntry(body, userId);

    return { data };
  }
}
