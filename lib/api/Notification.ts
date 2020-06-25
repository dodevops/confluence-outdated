import { Configuration } from './Configuration'
import { Confluence } from './Confluence'
import { createTransport } from 'nodemailer'
import * as Mail from 'nodemailer/lib/mailer'
import { DocumentInfo } from './DocumentInfo'
import * as Handlebars from 'handlebars'

export class Notification {
  private _configuration: Configuration
  private _confluence: Confluence
  private _transport: Mail

  constructor(configuration: Configuration, confluence: Confluence, transport: Mail = null) {
    this._configuration = configuration
    this._confluence = confluence
    this._transport = transport || createTransport(this._configuration.transportOptions)
  }

  public async notify(documentInfo: DocumentInfo): Promise<void> {
    const subjectTemplate = Handlebars.compile(this._configuration.notificationSubjectTemplate)
    const bodyTemplate = Handlebars.compile(this._configuration.notificationBodyTemplate)
    await this._transport.sendMail({
      from: this._configuration.notificationFrom,
      to: `${documentInfo.author}@${this._configuration.domain}`,
      subject: subjectTemplate(documentInfo),
      html: bodyTemplate(documentInfo),
    })
  }
}
