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

    log.info('Checking for outdated documents')

    const configuration = new Configuration(
      options.confluenceUrl,
      options.confluenceUser,
      options.confluencePassword,
      options.configurationDocumentId
    )
    await configuration.load()

    const confluence = new Confluence(options.confluenceUrl, options.confluenceUser, options.confluencePassword)

    const notification = new Notification(configuration, options.smtpTransportUrl, confluence, null, options.dryRun)

    for (const check of configuration.checks) {
      log.debug(`Checking for documents older than ${check.maxAge} day(s) with label(s) ${check.labels.join(',')}`)
      let filter = `label = ${check.labels.join('AND label = ')}`
      if (configuration.space && configuration.space != '') {
        filter = `${filter} AND space = ${configuration.space}`
      }
      const checkedDocuments = await confluence.findDocumentsOlderThan(filter, check.maxAge)

      for (const checkedDocument of checkedDocuments) {
        await notification.notify(checkedDocument)
      }
    }
  }
}
