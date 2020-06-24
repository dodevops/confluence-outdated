/**
 * Thrown when the configuration document can not be read or interpreted
 */
export class ConfigurationError implements Error {
  public message: string
  public name: string
  public stack: string

  constructor() {
    this.message = 'Can not load configuration document'
    this.name = 'ConfigurationError'
  }
}
