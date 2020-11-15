import { Injectable } from '@nestjs/common';
import { MathsService } from 'src/common/services/maths/maths.service';
import { Salary } from 'src/salary/schemas/salary.schema';

import { BandService } from '../band/band.service';

@Injectable()
export class IncomeTaxService {
  constructor(private readonly _bandService: BandService) {}

  public getMonthlyIncomeTaxFromAnnualSalary(
    annualSalary: number,
    date: string
  ) {
    const yearlyTax = this._getRawYearlyTax(annualSalary, date);

    const monthlyTax = yearlyTax / 12;

    return monthlyTax;
  }

  public getMonthlyIncomeTaxFromMonthlySalary(
    monthlySalary: number,
    date: string
  ): number {
    const annualSalary = MathsService.round1(monthlySalary * 12);

    const updatedMonthlySalary = this.getMonthlyIncomeTaxFromAnnualSalary(
      annualSalary,
      date
    );

    return MathsService.round2(updatedMonthlySalary);
  }

  public getYearlyIncomeTaxFromYearlySalary(
    annualSalary: number,
    date: string
  ): number {
    const rawYearlyTax = this._getRawYearlyTax(annualSalary, date);

    return rawYearlyTax;
  }

  public getTotalTaxPaidInCollection(collection: Salary[]): number {
    return collection.reduce(
      (accum: number, entry: Salary) => accum + entry.incomeTax,
      0
    );
  }

  private _getRawYearlyTax(annualSalary: number, date: string): number {
    return this._bandService.getYearlyPayment(
      annualSalary,
      this._bandService.getTaxBands(date)
    );
  }
}
