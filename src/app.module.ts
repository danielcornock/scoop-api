import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { localDatabaseUriString } from './config/misc/env';
import { NetWorthModule } from './net-worth/net-worth.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forRoot(localDatabaseUriString),
    SettingsModule,
    NetWorthModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
