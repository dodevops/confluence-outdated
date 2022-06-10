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
  private _notificationBatch: { [author: string]: Array<DocumentInfo> } = {}

  constructor(configuration: Configuration, smtpTransportUrl: string, confluence: Confluence, transport: Mail = null, dryRun = false) {
    this._configuration = configuration
    this._confluence = confluence
    this._transport = transport || createTransport(smtpTransportUrl)

    this._log = log.getLogger('Notification')
    this._dryRun = dryRun
  }

  public async notify(documentInfos: Array<DocumentInfo>): Promise<void> {
    Handlebars.registerHelper('moment', (text, format) => {
      return moment(text).format(format)
    })
    const subjectTemplate = Handlebars.compile(this._configuration.notificationSubjectTemplate)
    const bodyTemplate = Handlebars.compile(this._configuration.notificationBodyTemplate)

    for (const documentInfo of documentInfos) {
      for (const exception of this._configuration.exceptions) {
        if (documentInfo.matchesPath(exception)) {
          this._log.info(`Skipping ${documentInfo.title} because it matches the exception ${exception}`)
          return
        }
      }

      documentInfo.lastVersionDate = (documentInfo.lastVersionDate as Moment).toISOString() as string

      for (const maintainer of this._configuration.maintainer) {
        if (documentInfo.matchesPath(maintainer.pagePattern)) {
          documentInfo.author = maintainer.maintainer.replace(/_lastauthor/, documentInfo.author)
        }
      }

      let to = documentInfo.author.split(/,/)
      if (this._configuration.domain) {
        to = to.map((target) => `${target}@${this._configuration.domain}`)
      }

      for (const recipient of to) {
        if (!(recipient in this._notificationBatch)) {
          this._notificationBatch[recipient] = []
        }

        this._notificationBatch[recipient].push(documentInfo)
      }
    }

    for (const recipient of Object.keys(this._notificationBatch)) {
      const mailOptions = {
        from: this._configuration.notificationFrom,
        to: recipient,
        subject: subjectTemplate({
          author: recipient,
          documentsCount: this._notificationBatch[recipient].length,
          multipleDocuments: this._notificationBatch[recipient].length > 1,
          documents: this._notificationBatch[recipient],
        }),
        html: bodyTemplate({
          author: recipient,
          documentsCount: this._notificationBatch[recipient].length,
          multipleDocuments: this._notificationBatch[recipient].length > 1,
          documents: this._notificationBatch[recipient],
        }),
      }

      this._log.info(`Notifying ${mailOptions.to} about ${this._notificationBatch[recipient].length} document(s)`)
      this._log.trace(mailOptions)
      if (!this._dryRun) {
        await this._transport.sendMail(mailOptions)
      }
    }
  }
}
