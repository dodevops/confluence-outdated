import { Configuration } from './Configuration'
import { Confluence } from './Confluence'
import { Logger } from 'loglevel'
import log = require('loglevel')
import { Notification } from './Notification'

/**
 * The main out of date checker
 */
export class OutdateCheck {
  /**
   * An instance of the configuration API
   */
  private _configuration: Configuration

  /**
   * An instance of the Confluence API
   */
  private _confluence: Confluence

  /**
   * An instance of the Notification API
   */
  private _notification: Notification

  /**
   * The class logger
   */
  private _log: Logger

  constructor(configuration: Configuration, confluence: Confluence) {
    this._configuration = configuration
    this._confluence = confluence

    this._notification = new Notification(this._configuration, this._confluence)

    this._log = log.getLogger('OutdateCheck')
  }

  /**
   * Check for outdated documents and notify the document supervisor
   */
  public async check(): Promise<void> {
    await this._configuration.load()
    for (const check of this._configuration.checks) {
      let cql = `space = ${this._configuration.space}`
      for (const label of check.labels) {
        cql += ` AND label = ${label}`
      }
      const resultingDocuments = await this._confluence.findDocumentsOlderThan(cql, check.maxAge)

      for (const documentInfo of resultingDocuments) {
        await this._notification.notify(documentInfo)
      }
    }
  }
}
