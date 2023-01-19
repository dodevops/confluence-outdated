import { Configuration } from './Configuration'
import { Confluence } from './Confluence'
import { createTransport } from 'nodemailer'
import * as Mail from 'nodemailer/lib/mailer'
import { DocumentInfo } from './DocumentInfo'
import * as Handlebars from 'handlebars'
import { Logger } from 'loglevel'
import log = require('loglevel')

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
    Handlebars.registerHelper('getRecipients', (documentInfo: DocumentInfo) => {
      return documentInfo.getRecipients(this._configuration.maintainer, this._configuration.domain).join(', ')
    })
  }

  public async notify(documentInfos: Array<DocumentInfo>): Promise<void> {
    const workingDocumentInfos = []
    documentInfos.forEach((entry) => {
      workingDocumentInfos.push(DocumentInfo.fromDocumentInfo(entry))
    })

    const subjectTemplate = Handlebars.compile(this._configuration.notificationSubjectTemplate)
    const bodyTemplate = Handlebars.compile(this._configuration.notificationBodyTemplate)

    process: for (const documentInfo of workingDocumentInfos) {
      for (const exception of this._configuration.exceptions) {
        if (documentInfo.matchesPath(exception)) {
          this._log.info(`Skipping ${documentInfo.title} because it matches the exception ${exception}`)
          continue process
        }
      }

      for (const excludedLabel of this._configuration.excludedLabels) {
        if (documentInfo.labels.some((label) => label.toLowerCase() == excludedLabel.toLowerCase())) {
          this._log.info(`Skipping ${documentInfo.title} because it has the excluded label ${excludedLabel}`)
          continue process
        }
      }

      const recipients = documentInfo.getRecipients(this._configuration.maintainer, this._configuration.domain)

      for (const recipient of recipients) {
        if (!(recipient in this._notificationBatch)) {
          this._notificationBatch[recipient] = []
        }

        if (!this._notificationBatch[recipient].some((docInfo) => docInfo === documentInfo)) {
          this._notificationBatch[recipient].push(documentInfo)
        }
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
