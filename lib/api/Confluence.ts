import got from 'got'
import moment = require('moment')
import { Logger } from 'loglevel'
import log = require('loglevel')
import { ConfluenceError } from '../error/ConfluenceError'
import { DocumentInfo } from './DocumentInfo'
import { Moment } from 'moment'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Confluence API
 *
 * Tool methods that deal with the Confluence Rest API themselves.
 */
export class Confluence {
  public confluenceUrl: string
  public confluenceUser: string
  public confluencePassword: string
  public confluencePersonalAccessToken: string
  private _log: Logger

  constructor(confluenceUrl: string, confluenceUser: string, confluencePassword: string, confluencePersonalAccessToken: string) {
    this.confluenceUrl = confluenceUrl
    this.confluenceUser = confluenceUser
    this.confluencePassword = confluencePassword
    this.confluencePersonalAccessToken = confluencePersonalAccessToken

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
      if (this.confluencePersonalAccessToken !== '') {
        results = await got(configurationUrl, {
          headers: {
            Authorization: 'Bearer ' + this.confluencePersonalAccessToken,
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).json<any>()
      } else {
        results = await got(configurationUrl, {
          username: this.confluenceUser,
          password: this.confluencePassword,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).json<any>()
      }
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
    const documentUrl = `${this.confluenceUrl}/rest/api/content/${documentId}?expand=ancestors,version,metadata.labels,history`
    if (this.confluencePersonalAccessToken !== '') {
      const document = await got(documentUrl, {
        headers: {
          Authorization: 'Bearer ' + this.confluencePersonalAccessToken,
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).json<any>()
    } else {
      const document = await got(documentUrl, {
        username: this.confluenceUser,
        password: this.confluencePassword,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).json<any>()
    }
    const author = document.version.by.username ?? null
    const creator = document.history['createdBy'].username ?? null

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

    if ((lastVersionDate as unknown as boolean) === false) {
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

    const path = document.ancestors.map((ancestor) => ancestor.title)

    const labels = document.metadata?.labels?.results?.map((label) => label.name) ?? []

    const documentInfo = new DocumentInfo(
      documentId,
      author,
      creator,
      (lastVersionDate as Moment).toISOString(),
      lastVersionMessage,
      title,
      path,
      url,
      document._links.webui,
      labels
    )

    return documentInfo
  }

  public async createConfigurationDocument(space: string, title: string, parentId: string): Promise<string> {
    const template = await fs.promises.readFile(path.join(__dirname, '..', '..', 'resources', 'configurationDocument.html'), 'utf-8')

    let response: any
    if (this.confluencePersonalAccessToken !== '') {
      response = await got
        .post(`${this.confluenceUrl}/rest/api/content`, {
          json: {
            type: 'page',
            title: title,
            space: {
              key: space,
            },
            ancestors: [
              {
                id: parentId,
              },
            ],
            body: {
              storage: {
                value: template,
                representation: 'storage',
              },
            },
          },
          headers: {
            Authorization: 'Bearer ' + this.confluencePersonalAccessToken,
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .json<any>()
    } else {
      response = await got
        .post(`${this.confluenceUrl}/rest/api/content`, {
          json: {
            type: 'page',
            title: title,
            space: {
              key: space,
            },
            ancestors: [
              {
                id: parentId,
              },
            ],
            body: {
              storage: {
                value: template,
                representation: 'storage',
              },
            },
          },
          username: this.confluenceUser,
          password: this.confluencePassword,
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .json<any>()
    }
    return response.id
  }
}
