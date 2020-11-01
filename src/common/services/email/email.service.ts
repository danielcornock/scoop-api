import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { html } from 'src/auth/templates/lib/html';
import {
  emailHost,
  emailPassword,
  emailPort,
  emailUsername,
  isProduction,
  sendgridPassword,
  sendgridUsername,
} from 'src/config/misc/env';

import { IEmailOptions } from './interfaces/email-options.interface';

@Injectable()
export class EmailService {
  private readonly _transporter: nodemailer.Transporter;

  constructor() {
    if (isProduction) {
      this._transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: sendgridUsername,
          pass: sendgridPassword
        }
      });
    } else {
      this._transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort),
        auth: {
          user: emailUsername,
          pass: emailPassword
        }
      });
    }
  }

  public async sendEmail(options: IEmailOptions): Promise<void> {
    const mailOptions: Mail.Options = {
      from: 'Scoop <hello@scoopfinance.co.uk>',
      to: options.to,
      subject: options.subject,
      html: html(options.message)
    };

    const email: nodemailer.SentMessageInfo = await this._transporter.sendMail(
      mailOptions
    );

    Logger.log(`Email successfully sent to ${email.accepted[0]}`, 'Operation');
  }
}
