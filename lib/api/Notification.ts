import { Configuration } from './Configuration'
import { Confluence } from './Confluence'
import { createTransport } from 'nodemailer'
import * as Mail from 'nodemailer/lib/mailer'
import { DocumentInfo } from './DocumentInfo'
import * as Handlebars from 'handlebars'
import { Logger } from 'loglevel'
import { Moment } from 'moment'
import log = require('loglevel')
import moment = require('moment')

export class Notification {
  private _configuration: Configuration
  private _confluence: Confluence
  private _transport: Mail
  private _log: Logger
  private readonly _dryRun: boolean

  constructor(configuration: Configuration, confluence: Confluence, transport: Mail = null, dryRun = false) {
    this._configuration = configuration
    this._confluence = confluence
    this._transport = transport || createTransport(this._configuration.transportOptions)

    this._log = log.getLogger('Notification')
    this._dryRun = dryRun
  }

  public async notify(documentInfo: DocumentInfo): Promise<void> {
    Handlebars.registerHelper('moment', (text, format) => {
      return moment(text).format(format)
    })
    const subjectTemplate = Handlebars.compile(this._configuration.notificationSubjectTemplate)
    const bodyTemplate = Handlebars.compile(this._configuration.notificationBodyTemplate)

    documentInfo.lastVersionDate = (documentInfo.lastVersionDate as Moment).toISOString() as string

    for (const maintainer of this._configuration.maintainer) {
      if (maintainer.pagePattern.test(documentInfo.title)) {
        documentInfo.author = maintainer.maintainer
      }
    }

    const mailOptions = {
      from: this._configuration.notificationFrom,
      to: `${documentInfo.author}@${this._configuration.domain}`,
      subject: subjectTemplate(documentInfo),
      html: bodyTemplate(documentInfo),
    }
    this._log.info(`Notifying ${mailOptions.to} about ${documentInfo.title}`)
    this._log.trace(mailOptions)
    if (!this._dryRun) {
      await this._transport.sendMail(mailOptions)
    }
  }
}
