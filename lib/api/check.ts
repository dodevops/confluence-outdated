/**
 * A description of a check
 */
export interface Check {
  /**
   * A list of labels that the document must have
   */
  labels: Array<string>

  /**
   * The maximum age of the document
   */
  maxAge: number
}

/**
 * An implementation of the check interface
 */
export class Check implements Check {
  public labels: Array<string>
  public maxAge: number

  constructor(labels: Array<string>, maxAge: number) {
    this.labels = labels
    this.maxAge = maxAge
  }
}
