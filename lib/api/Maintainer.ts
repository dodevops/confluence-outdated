/**
 * A maintainer definition for pages matching a pattern.
 * Will override the last version author
 */
export interface Maintainer {
  /**
   * A pattern matching the document title
   */
  pagePattern: RegExp
  /**
   * The username of the user maintaining the pages matching the pattern
   */
  maintainer: string
}

export class Maintainer implements Maintainer {
  public maintainer: string
  public pagePattern: RegExp

  constructor(maintainer: string, pagePattern: RegExp) {
    this.maintainer = maintainer
    this.pagePattern = pagePattern
  }
}
