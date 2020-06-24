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
   * The date of the last version
   */
  lastVersionDate: Moment
  /**
   * The edit message of the last version
   */
  lastVersionMessage: string
  /**
   * The document URL
   */
  url: string
}

export class DocumentInfo implements DocumentInfo {
  public id: number
  public author: string
  public lastVersionDate: moment.Moment
  public lastVersionMessage: string
  public title: string
  public url: string

  constructor(id: number, author: string, lastVersionDate: moment.Moment, lastVersionMessage: string, title: string, url: string) {
    this.id = id
    this.author = author
    this.lastVersionDate = lastVersionDate
    this.lastVersionMessage = lastVersionMessage
    this.title = title
    this.url = url
  }
}
