/**
 * @module confluence-outdated
 */
/**
 */

// import needed modules

import * as loglevel from 'loglevel'
import Bluebird = require('bluebird')

/**
 * confluence-outdated - Constant validation of Confluence document outdates
 */
export class ExampleClass {
  /**
   * Use a logger instance to log, what you're doing
   */
  private _log: loglevel.Logger = null

  constructor() {
    this._log = loglevel.getLogger('confluence-outdated:ExampleClass')
  }

  /**
   * Be nice.
   * @param {string} name Who are you?
   * @return {Bluebird<string>} My greets to you
   */
  public helloWorld(name: string): Bluebird<string> {
    if (name === '') {
      return Bluebird.reject(new Error('Found nobody to greet'))
    }
    return Bluebird.resolve(`Hello ${name}`)
  }
}
