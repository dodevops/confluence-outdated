import { Configuration } from './configuration'
import { Confluence } from './confluence'
import { createTransport } from 'nodemailer'
import * as Mail from 'nodemailer/lib/mailer'

export class Notification {
  private _configuration: Configuration
  private _confluence: Confluence
  private _transport: Mail

  constructor(configuration: Configuration, confluence: Confluence) {
    this._configuration = configuration
    this._confluence = confluence
    this._transport = createTransport(this._configuration.transportOptions)
  }

  public async notify(documentInfo: DocumentInfo): Promise<void> {
    this._transport.sendMail({
      to: `${documentInfo.author}@${this._configuration.domain}`,
      subject
    })
  }
}
