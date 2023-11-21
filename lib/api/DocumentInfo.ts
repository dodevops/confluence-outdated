import { Maintainer } from './Maintainer'

/**
 * Informations about a Confluence document
 */
export interface DocumentInfo {
  /**
   * Document ID
   */
  id: number
  /**
   * Document author
   */
  author: string
  /**
   * Document title
   */
  title: string
  /**
   * Path to document
   */
  path: Array<string>
  /**
   * The date of the last version
   */
  lastVersionDate: string
  /**
   * The edit message of the last version
   */
  lastVersionMessage: string
  /**
   * The document URL
   */
  url: string

  /**
   * Check whether the complete path to this document matches the given regexp
   * @param regexp
   */
  matchesPath(regexp: RegExp): boolean

  /**
   * Get the notification recipients for this document info. Usually contains of the last author and the
   * maintainers
   * @param maintainers
   */
  getRecipients(maintainers: Maintainer[], domain?: string): string[]
}

export class DocumentInfo implements DocumentInfo {
  public id: number
  public author: string
  public creator: string
  public lastVersionDate: string
  public lastVersionMessage: string
  public title: string
  public path: Array<string>
  public url: string
  public shortUrl: string
  public labels: Array<string>

  constructor(
    id: number,
    author: string,
    creator: string,
    lastVersionDate: string,
    lastVersionMessage: string,
    title: string,
    path: Array<string>,
    url: string,
    shortUrl: string,
    labels: Array<string>
  ) {
    this.id = id
    this.author = author
    this.creator = creator
    this.lastVersionDate = lastVersionDate
    this.lastVersionMessage = lastVersionMessage
    this.title = title
    this.path = path
    this.url = url
    this.shortUrl = shortUrl
    this.labels = labels
  }

  public matchesPath(regexp: RegExp): boolean {
    return regexp.test(this.path.concat([this.title]).join('/'))
  }

  public static fromDocumentInfo(documentInfo: DocumentInfo): DocumentInfo {
    return new DocumentInfo(
      documentInfo.id,
      documentInfo.author,
      documentInfo.creator,
      documentInfo.lastVersionDate,
      documentInfo.lastVersionMessage,
      documentInfo.title,
      documentInfo.path,
      documentInfo.url,
      documentInfo.shortUrl,
      documentInfo.labels
    )
  }

  public getRecipients(maintainers: Maintainer[], domain?: string): string[] {
    const retval = []
    let addLastAuthor = maintainers.length > 0 ? false : true
    let addCreator = false
    for (const maintainer of maintainers) {
      if (this.matchesPath(maintainer.pagePattern)) {
        const maintainers = maintainer.maintainer.split(/,/)
        if (maintainers.indexOf('_lastauthor') > 0) {
          addLastAuthor = true
        }
        if (maintainers.indexOf('_creator') > 0) {
          addCreator = true
        }
        retval.push(...maintainers.filter((entry) => ['_lastauthor', '_creator'].indexOf(entry) == -1))
      }
    }
    if (addLastAuthor) {
      retval.push(this.author)
    }
    if (addCreator) {
      retval.push(this.creator)
    }
    if (domain) {
      return retval.map((target) => `${target}@${domain}`)
    }
    return retval
  }
}
