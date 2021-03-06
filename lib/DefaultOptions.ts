import { option, Options } from 'clime'
import * as log from 'loglevel'
import * as prefix from 'loglevel-plugin-prefix'

export class DefaultOptions extends Options {
  @option({
    name: 'url',
    flag: 'U',
    description: 'URL to your Confluence instance',
    required: true,
  })
  confluenceUrl: string

  @option({
    name: 'user',
    flag: 'u',
    description: 'Username for checking all confluence documents',
    required: true,
  })
  confluenceUser: string

  @option({
    name: 'password',
    flag: 'p',
    description: 'Password for the user',
    required: true,
  })
  confluencePassword: string

  @option({
    description: 'Log-Level to use (trace, debug, verbose, info, warn, error)',
    default: 'error',
    validator: /trace|debug|verbose|info|warn|error/,
  })
  public loglevel: string

  public getLogger(): log.Logger {
    prefix.reg(log)
    prefix.apply(log, {
      template: '[%t] %l (%n)',
    })
    log.setDefaultLevel(this.loglevel as log.LogLevelDesc)
    return log.getLogger('cli')
  }
}
