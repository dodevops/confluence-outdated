import { command, Command, metadata, option } from 'clime'
import { Configuration } from '../api/Configuration'
import { Confluence } from '../api/Confluence'
import { Notification } from '../api/Notification'
import { DefaultOptions } from '../DefaultOptions'

export class CheckOptions extends DefaultOptions {
  @option({
    name: 'id',
    flag: 'i',
    description: 'ID of configuration document',
    required: true,
  })
  configurationDocumentId: string

  @option({
    name: 'dryrun',
    flag: 'd',
    description: 'Do not send notifications',
    toggle: true,
  })
  dryRun: boolean

  @option({
    name: 'smtpurl',
    flag: 's',
    description: 'SMTP URL (check out https://nodemailer.com/smtp/ for options)',
    required: true,
  })
  smtpTransportUrl: string
}

@command({
  description: 'Check confluence for outdated documents',
})
export default class extends Command {
  @metadata
  public async execute(options: CheckOptions): Promise<void> {
    const log = options.getLogger()

    if( options.confluencePersonalAccessToken === '' && ( options.confluenceUser === '' || options.confluencePassword === '')) {
      log.error('user and/or password parameter not set or empty! When not using the token parameter both of these have to be set!')
      return
    }

    log.info('Checking for outdated documents')

    const configuration = new Configuration(
      options.confluenceUrl,
      options.confluenceUser,
      options.confluencePassword,
      options.confluencePersonalAccessToken,
      options.configurationDocumentId
    )
    await configuration.load()

    const confluence = new Confluence(options.confluenceUrl, options.confluenceUser, options.confluencePassword, options.confluencePersonalAccessToken)

    const notification = new Notification(configuration, options.smtpTransportUrl, confluence, null, options.dryRun)

    const checkedDocuments = []

    for (const check of configuration.checks) {
      log.debug(`Checking for documents older than ${check.maxAge} day(s) with label(s) ${check.labels.join(',')}`)
      let filter = `label = ${check.labels.join('AND label = ')}`
      if (configuration.space && configuration.space != '') {
        filter = `${filter} AND space = ${configuration.space}`
      }
      checkedDocuments.push(...(await confluence.findDocumentsOlderThan(filter, check.maxAge)))
    }

    await notification.notify(checkedDocuments)
  }
}
