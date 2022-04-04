import got from 'got'
import { Check } from './Check'
import { Logger } from 'loglevel'
import { ConfigurationError } from '../error/ConfigurationError'
import * as cheerio from 'cheerio'
import { Maintainer } from './Maintainer'
import log = require('loglevel')
import Root = cheerio.Root

/**
 * Configuration API
 * Reads a document from Confluence which contains outdate check configurations.
 *
 * The document is structured like this:
 *
 * A first order title with the word "Checks"
 * A table. The first column should hold a list of labels. The second one should hold the maximum age of documents
 * that have this label
 *
 */
export class Configuration {
  /**
   * The Confluence base URL
   */
  public confluenceUrl: string

  /**
   * A user to connect to Confluence
   */
  public confluenceUser: string

  /**
   * The password of the Confluence user
   */
  public confluencePassword: string

  /**
   * The document id of the configuration document
   */
  public configurationDocumentId: string

  /**
   * The space key where the out date check should work in
   */
  public space: string

  /**
   * Domain to add to all usernames
   */
  public domain: string

  /**
   * From address for notifications
   */
  public notificationFrom: string

  /**
   * A list of checks for outdated documents
   */
  public checks: Array<Check>

  /**
   * A list of page maintainers
   */
  public maintainer: Array<Maintainer>

  /**
   * A Handlebars template for the notification mail subject
   */
  public notificationSubjectTemplate: string

  /**
   * A Handlebars template for the notification mail body
   */
  public notificationBodyTemplate: string

  /**
   * Was the configuration already loaded?
   */
  private _loaded: boolean

  /**
   * The class logger
   */
  private _log: Logger

  constructor(confluenceUrl: string, confluenceUser: string, confluencePassword: string, configurationDocumentId: string) {
    this.confluenceUrl = confluenceUrl
    this.confluenceUser = confluenceUser
    this.confluencePassword = confluencePassword
    this.configurationDocumentId = configurationDocumentId
    this.checks = []
    this._loaded = false

    this._log = log.getLogger('Configuration')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getConfigurationFromPanel($: Root, panelName: string, lowerCase = true): Array<any> {
    const keys = $(`ac\\:parameter:contains("${panelName}") + ac\\:rich-text-body table tr th`)
    const values = $(`ac\\:parameter:contains("${panelName}") + ac\\:rich-text-body table tr td`)
    const rows = $(`ac\\:parameter:contains("${panelName}") + ac\\:rich-text-body table tr td`).parent()
    const returnObject = []
    for (let i = 0; i < rows.length; i++) {
      const rowObject = {}
      keys.each((index, key) => {
        let configurationKey = $(key).text()
        if (lowerCase) {
          configurationKey = configurationKey.toLowerCase()
        }
        rowObject[configurationKey] = $(values[index + i * 2]).text()
      })
      returnObject.push(rowObject)
    }
    return returnObject
  }

  /**
   * Load the configuration document
   */
  public async load(): Promise<void> {
    if (!this._loaded) {
      const configurationUrl = `${this.confluenceUrl}/rest/api/content/${this.configurationDocumentId}?expand=body.storage`
      this._log.info(`Loading configuration document from ${configurationUrl} as ${this.confluenceUser}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let configurationDocument: any
      try {
        configurationDocument = await got(configurationUrl, {
          username: this.confluenceUser,
          password: this.confluencePassword,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).json<any>()
      } catch (e) {
        this._log.error(`Can't fetch configuration document: (${e.name}) ${e.message}`)
        throw e
      }

      this._log.trace(`Configuration document content: 
      ${configurationDocument.body.storage.value}`)

      const $ = cheerio.load(configurationDocument.body.storage.value)

      if ($ === null) {
        this._log.error(`Can not interpret configuration document body:
        ${configurationDocument.body.storage.value}`)
        throw new ConfigurationError()
      }

      // Load configuration

      const configuration = this._getConfigurationFromPanel($, 'Configuration')[0]

      this.domain = configuration.domain || null
      this.space = configuration.space || null
      this.notificationFrom = configuration.notificationfrom || null

      // Load checks

      this.checks = this._getConfigurationFromPanel($, 'Checks').map<Check>((value) => {
        return {
          labels: value.labels.split(','),
          maxAge: parseInt(value.maxage),
        }
      })

      // Load maintainer

      this.maintainer = this._getConfigurationFromPanel($, 'Maintainer').map<Maintainer>((value) => {
        return {
          pagePattern: new RegExp(value.pagepattern),
          maintainer: value.maintainer,
        }
      })

      this.notificationSubjectTemplate = $(
        'ac\\:parameter:contains("Notification Template") + ac\\:rich-text-body ac\\:parameter:contains("Subject") + ac\\:rich-text-body'
      ).text()

      this.notificationBodyTemplate = $(
        'ac\\:parameter:contains("Notification Template") + ac\\:rich-text-body ac\\:parameter:contains("Body") + ac\\:rich-text-body'
      ).html()

      this._loaded = true
    }
  }
}
