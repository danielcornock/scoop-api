import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseLogService } from 'src/common/abstracts/base-log.service';
import { defaultIcons } from 'src/common/constants/default-icons.constant';
import { ILabelValue } from 'src/common/interfaces/label-value.interface';
import { INetWorthCustomValues } from 'src/net-worth/interfaces/net-worth-log.interface';
import { NetWorth } from 'src/net-worth/schemas/net-worth.schema';
import { INetWorthCreate } from 'src/net-worth/transfer-objects/net-worth-create.dto';
import { NetWorthResponse } from 'src/net-worth/transfer-objects/net-worth-response.dto';
import { INetWorthSummaryItemConfig } from 'src/settings/interfaces/net-worth-summary-item-config.interface';
import { SettingsService } from 'src/settings/services/settings/settings.service';

@Injectable()
export class NetWorthService extends BaseLogService<NetWorth> {
  constructor(
    @InjectModel(NetWorth.name)
    netWorthRepo: Model<NetWorth>,
    private readonly _settingsService: SettingsService
  ) {
    super(netWorthRepo);
  }

  public async createEntry(
    entry: INetWorthCreate,
    user: string
  ): Promise<NetWorth> {
    await this._checkIfEntryForMonthExists(user, entry.date);

    const settings = await this._settingsService.getSettings(user);
    const customValues = this._settingsService.processCustomValues(
      entry,
      settings.netWorthFields
    );
    const sumOfAllFields = this._settingsService.getCustomValuesSum(
      customValues
    );

    const data = this._repo.create({
      date: entry.date,
      user,
      customValues,
      total: sumOfAllFields
    });

    return data;
  }

  public async updateLogByDate(
    date: string,
    data: INetWorthCustomValues,
    user: string
  ): Promise<NetWorth> {
    const customValues = this._settingsService.processCustomValues(
      data,
      Object.keys(data)
    );
    const sumOfAllFields = this._settingsService.getCustomValuesSum(
      customValues
    );
    const newNetWorthLog = {
      customValues,
      total: sumOfAllFields
    };

    const newData = await this._repo.findOneAndUpdate(
      { date, user },
      newNetWorthLog,
      {
        new: true
      }
    );

    return newData;
  }

  public getSummaryItemsMeta(
    entry: NetWorthResponse,
    summaryItems: INetWorthSummaryItemConfig[]
  ): { label: string; value: number; icon: string }[] {
    if (!entry) {
      return null;
    }

    return summaryItems.map((item, index) => {
      let accumValue = 0;

      item.sumOf.forEach((field) => {
        const fieldValue = entry[field] || entry.customValues[field] || 0;
        accumValue += fieldValue;
      });

      return {
        label: item.label,
        value: accumValue,
        icon: item.icon || defaultIcons[index]
      };
    });
  }

  public async getAll(user: string): Promise<NetWorthResponse[]> {
    const allEntries = await super.getAllSorted(user);

    return allEntries.map(
      (entry: NetWorth, index: number, array: NetWorth[]) => {
        const lastMonthTotal = array[index + 1]?.total;
        const change = lastMonthTotal ? entry.total - lastMonthTotal : 0;
        return {
          ...entry.toObject(),
          change,
          '% Change': change / lastMonthTotal
        };
      }
    );
  }

  public getSortedAndGroupedValues(
    item: INetWorthCustomValues,
    fields: Array<string>
  ): Array<ILabelValue> {
    const arrayOfFields = fields
      .map((fieldName) => {
        return { label: fieldName, value: item[fieldName] };
      })
      .sort((a, b) => b.value - a.value)
      .filter((item) => item.value >= 0);

    if (arrayOfFields.length <= 6) {
      return arrayOfFields;
    } else {
      /* Take the top 5 values */
      const topValues = arrayOfFields.splice(0, 5);

      /* Reduce the remaining values down to a single value */
      const reducedValues = arrayOfFields.reduce((accum, next) => {
        return (accum += next.value);
      }, 0);

      /* Return the top 5 values alongside 'other' */
      return [...topValues, { label: 'Other', value: reducedValues }];
    }
  }

  public async getAllFieldsFromCurrentResourceAndActiveFields(
    userId: string,
    resourceToEdit: NetWorth
  ): Promise<Array<string>> {
    const settings = await this._settingsService.getSettings(userId);

    return [
      ...new Set([
        ...settings.netWorthFields,
        ...Object.keys(resourceToEdit.customValues)
      ])
    ];
  }

  public async removeAllAssociatedEntries(user: string): Promise<void> {
    await this._repo.deleteMany({ user });
  }
}
