import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { User } from './user.schema';

@Schema()
export class UserSettings extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: string | User;

  @Prop({ type: Boolean, default: true })
  enableInvestments?: boolean;

  @Prop({ type: Boolean, default: true })
  enableNetWorth?: boolean;

  @Prop({ type: Boolean, default: true })
  enableMonthlyDistribution?: boolean;

  @Prop({ type: String, default: '£' })
  preferredCurrency?: string;

  @Prop({ type: Boolean, default: true })
  enableEmailNotifications?: boolean;

  @Prop({ type: String, default: '01' })
  reminderDate?: string;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);
