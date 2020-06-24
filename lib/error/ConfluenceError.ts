/**
 * An error thrown by the Confluence API
 */
export class ConfluenceError implements Error {
  public message: string
  public name: string
  public stack: string

  constructor(message: string) {
    this.name = 'ConfluenceError'
    this.message = `Confluence API error: ${message}`
  }
}
