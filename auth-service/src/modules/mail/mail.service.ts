import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAIL_QUEUE } from './mail.constants';
import { MailJobPayload, SendMailOptions } from './interfaces/mail.interface';

@Injectable()
export class MailService {
  constructor(
    private readonly config: ConfigService,
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
  ) {}

  async send(options: SendMailOptions): Promise<void> {
    const from = this.config.get<string>('MAIL_FROM') ?? 'noreply@example.com';
    const to = Array.isArray(options.to) ? options.to : [options.to];
    const cc = options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined;
    const bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined;

    const payload: MailJobPayload = {
      from,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      template: options.template,
      context: options.context,
      cc,
      bcc,
      attachments: options.attachments,
    };

    await this.mailQueue.add('send', payload);
  }
}
