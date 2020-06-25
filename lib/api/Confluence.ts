import got from 'got'
import moment = require('moment')
import { Logger } from 'loglevel'
import log = require('loglevel')
import { ConfluenceError } from '../error/ConfluenceError'
import { DocumentInfo } from './DocumentInfo'
import { Moment } from 'moment'

/**
 * Confluence API
 *
 * Tool methods that deal with the Confluence Rest API themselves.
 */
export class Confluence {
  public confluenceUrl: string
  public confluenceUser: string
  public confluencePassword: string
  private _log: Logger

  constructor(confluenceUrl: string, confluenceUser: string, confluencePassword: string) {
    this.confluenceUrl = confluenceUrl
    this.confluenceUser = confluenceUser
    this.confluencePassword = confluencePassword

    this._log = log.getLogger('Confluence')
  }

  /**
   * Find documents older than a given date
   *
   * @param filter A CQL filter
   * @param maxAge the maximum age
   * @param limit the batch limit when fetching documents
   * @return An array of document ids
   */
  public async findDocumentsOlderThan(filter: string, maxAge: number, limit = 25): Promise<Array<DocumentInfo>> {
    const oldDate = moment().subtract(maxAge, 'days').format('YYYY-MM-DD')
    let cql = `lastmodified < ${oldDate}`
    if (filter) {
      cql = `${cql} and ${filter}`
    }
    const documentInfos = []
    let start = 0
    let results
    this._log.debug(`Searching for documents with ${cql}`)
    do {
      const configurationUrl = `${this.confluenceUrl}/rest/api/content/search?cql=${cql}&start=${start}&limit=${limit}`
      results = await got(configurationUrl, {
        username: this.confluenceUser,
        password: this.confluencePassword,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).json<any>()
      for (const result of results.results) {
        documentInfos.push(await this.getDocumentInfo(result.id))
      }
      start = start + limit
    } while (results.size + results.start < results.totalSize)
    this._log.debug(`Found ${documentInfos.length} document(s)`)
    return documentInfos
  }

  /**
   * Get the usernane, that authored the most current version of a document
   * @param documentId the document ID
   * @return the author's username
   */
  public async getDocumentInfo(documentId: number): Promise<DocumentInfo> {
    this._log.debug(`Getting document information of document ${documentId}`)
    const documentUrl = `${this.confluenceUrl}/rest/api/content/${documentId}`
    const document = await got(documentUrl, {
      username: this.confluenceUser,
      password: this.confluencePassword,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).json<any>()

    const author = (document && document.version && document.version.by && document.version.by.username) || null

    if (!author) {
      this._log.error(`Can't get author from this document:
      ${document}`)
      throw new ConfluenceError(`Can't get author from document ${documentId}`)
    }

    const lastVersionDateString = (document && document.version && document.version.when) || null

    if (!lastVersionDateString) {
      this._log.error(`Can't get last version from this document:
      ${document}`)
      throw new ConfluenceError(`Can't get last version from document ${documentId}`)
    }

    const lastVersionDate: Moment = moment(lastVersionDateString)

    if (((lastVersionDate as unknown) as boolean) === false) {
      const errorMessage = `Moment can't interpret the version date ${lastVersionDateString}`
      this._log.error(errorMessage)
      throw new ConfluenceError(errorMessage)
    }

    const lastVersionMessage = (document && document.version && document.version.message) || ''

    const title = (document && document.title) || null

    if (!title) {
      this._log.error(`Document has no title:
      ${document}`)
      throw new ConfluenceError(`Document ${documentId} has no title`)
    }

    const url =
      (document && document._links && document._links.base && document._links.webui && document._links.base + document._links.webui) || null

    if (!url) {
      this._log.error(`Can not construct a URL from
      ${document}`)
      throw new ConfluenceError(`Document ${documentId} has no URL}`)
    }

    const documentInfo = new DocumentInfo(documentId, author, lastVersionDate, lastVersionMessage, title, url)

    return documentInfo
  }
}
