export interface SendMailOptions {
  to: string | string[];
  subject: string;
  /** Plain-text fallback (used when template is not available). */
  text?: string;
  /** Raw HTML content (mutually exclusive with template). */
  html?: string;
  /** Handlebars template name (without .hbs extension). */
  template?: string;
  /** Variables passed to the template. */
  context?: Record<string, unknown>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: MailAttachment[];
}

export interface MailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

/** Payload stored on the BullMQ job. */
export interface MailJobPayload {
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, unknown>;
  cc?: string[];
  bcc?: string[];
  attachments?: MailAttachment[];
}
