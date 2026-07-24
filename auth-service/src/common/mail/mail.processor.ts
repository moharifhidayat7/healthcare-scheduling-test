import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MAIL_QUEUE } from './mail.constants';
import { MailJobPayload } from './interfaces/mail.interface';

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private transporter: nodemailer.Transporter;
  private templateCache = new Map<string, handlebars.TemplateDelegate>();

  constructor(private readonly config: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      auth: this.config.get<string>('MAIL_USER')
        ? {
            user: this.config.get<string>('MAIL_USER'),
            pass: this.config.get<string>('MAIL_PASSWORD'),
          }
        : undefined,
    });
  }

  async process(job: Job<MailJobPayload>): Promise<void> {
    const payload = job.data;
    let html = payload.html;

    if (payload.template) {
      html = await this.renderTemplate(payload.template, payload.context ?? {});
    }

    await this.transporter.sendMail({
      from: payload.from,
      to: payload.to.join(', '),
      cc: payload.cc?.join(', '),
      bcc: payload.bcc?.join(', '),
      attachments: payload.attachments,
      text: payload.text,
      html,
    });
  }

  private async renderTemplate(name: string, context: Record<string, unknown>): Promise<string> {
    const cached = this.templateCache.get(name);
    if (cached) {
      return cached(context);
    }
    const source = await readFile(join('./templates/mail', `${name}.hbs`), 'utf-8');
    const template = handlebars.compile(source);
    this.templateCache.set(name, template);
    return template(context);
  }
}
