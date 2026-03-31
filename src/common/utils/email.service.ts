import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { logger } from './logger';
import {
  forgotPasswordTemplate,
  goalProofPromptTemplate,
  passwordChangedTemplate
} from './email-templates';

export class EmailService {
  private readonly transporter: Transporter | null;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(env.smtpUser && env.smtpPass);

    if (!this.isConfigured) {
      this.transporter = null;
      logger.warn('SMTP credentials not configured. Emails will be skipped.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }

  private async sendMail(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    if (!this.transporter) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.smtpFrom,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to: input.to,
        subject: input.subject,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  public async sendForgotPasswordEmail(input: {
    to: string;
    username: string;
    resetLink: string;
  }): Promise<void> {
    const template = forgotPasswordTemplate(input.username, input.resetLink);
    await this.sendMail({
      to: input.to,
      ...template
    });
  }

  public async sendPasswordChangedEmail(input: { to: string; username: string }): Promise<void> {
    const template = passwordChangedTemplate(input.username);
    await this.sendMail({
      to: input.to,
      ...template
    });
  }

  public async sendGoalProofPromptEmail(input: {
    to: string;
    username: string;
    goalTitle: string;
  }): Promise<void> {
    const template = goalProofPromptTemplate(input.username, input.goalTitle);
    await this.sendMail({
      to: input.to,
      ...template
    });
  }
}
