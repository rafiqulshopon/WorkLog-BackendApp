import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    firstName: string,
    email: string,
    otp: string,
    slug: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Email Verification',
      template: 'verification',
      context: {
        firstName,
        otp,
        slug,
      },
    });
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    slug: string,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'You are Invited!',
      template: 'invitation',
      context: {
        token,
        slug,
      },
    });
  }
}
