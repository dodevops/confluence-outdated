import { Moment } from 'moment'

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
  lastVersionDate: Moment | string
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
}

export class DocumentInfo implements DocumentInfo {
  public id: number
  public author: string
  public lastVersionDate: Moment | string
  public lastVersionMessage: string
  public title: string
  public path: Array<string>
  public url: string
  public shortUrl: string
  public labels: Array<string>

  constructor(
    id: number,
    author: string,
    lastVersionDate: Moment,
    lastVersionMessage: string,
    title: string,
    path: Array<string>,
    url: string,
    shortUrl: string,
    labels: Array<string>
  ) {
    this.id = id
    this.author = author
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
}
