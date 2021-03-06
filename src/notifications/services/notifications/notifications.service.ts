import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { staticNotificationsDictionary } from 'src/notifications/constants/static-notifications.constant';
import { STATIC_NOTIFICATION } from 'src/notifications/constants/static-notifications.enum';
import { IStaticNotification } from 'src/notifications/interfaces/notification.interface';
import { Notification } from 'src/notifications/schemas/notifications.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly _notificationRepo: Model<Notification>
  ) {}

  public async createStaticNotification(
    notificationType: STATIC_NOTIFICATION,
    user: Types.ObjectId
  ): Promise<Notification> {
    const notification = await this._notificationRepo.create({
      ...this._getNotification(notificationType),
      user: user.toHexString()
    });

    return notification;
  }

  public async createStaticMultiNotification(
    notificationType: STATIC_NOTIFICATION,
    users: Array<string>
  ): Promise<Notification[]> {
    const notificationsToCreate = users.map((user: string) => {
      return {
        user,
        ...this._getNotification(notificationType)
      };
    });

    const notifications = await this._notificationRepo.insertMany(
      notificationsToCreate
    );

    return notifications;
  }

  public async createCustomMultiNotification(
    notification: IStaticNotification,
    users: Array<string>
  ): Promise<Notification[]> {
    const notificationsToCreate = users.map((user: string) => {
      return {
        user,
        ...notification
      };
    });
    const notifications = await this._notificationRepo.insertMany(
      notificationsToCreate
    );

    return notifications;
  }

  public async getAllNotifications(user: string): Promise<Notification[]> {
    const data = await this._notificationRepo
      .find()
      .sort({ createdOn: 'desc' });

    return data.filter((notification) => notification.user === user);
  }

  public async deleteNotification(_id: string, user: string): Promise<void> {
    await this._notificationRepo.deleteOne({ _id, user });
  }

  public async removeAllAssociatedEntries(user: string): Promise<void> {
    await this._notificationRepo.deleteMany({ user });
  }

  private _getNotification(type: STATIC_NOTIFICATION): IStaticNotification {
    return staticNotificationsDictionary[type];
  }
}
