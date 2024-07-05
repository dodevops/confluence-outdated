import { command, Command, metadata, option } from 'clime'
import { Confluence } from '../api/Confluence'
import { DefaultOptions } from '../DefaultOptions'

export class CheckOptions extends DefaultOptions {
  @option({
    name: 'space',
    flag: 's',
    description: 'Space where the document should be',
    required: true,
  })
  space: string

  @option({
    name: 'title',
    flag: 't',
    description: 'Title of the configuration document',
    required: true,
  })
  title: string

  @option({
    name: 'parentId',
    flag: 'P',
    description: 'Id of a parent page under which the configuration document should be placed',
    required: true,
  })
  parentId: string
}

@command({
  description: 'Create a new empty configuration document',
})
export default class extends Command {
  @metadata
  public async execute(options: CheckOptions): Promise<string> {
    const log = options.getLogger()

    if( options.confluencePersonalAccessToken === '' && ( options.confluenceUser === '' || options.confluencePassword === '')) {
      log.error('user and/or password parameter not set or empty! When not using the token parameter both of these have to be set!')
      return
    }

    log.info('Checking for outdated documents')

    const confluence = new Confluence(options.confluenceUrl, options.confluenceUser, options.confluencePassword, options.confluencePersonalAccessToken)

    const pageId = await confluence.createConfigurationDocument(options.space, options.title, options.parentId)

    return `The configuration document was created with the ID
    ${pageId}
    Check it out at ${options.confluenceUrl}/pages/viewpage.action?pageId=${pageId}`
  }
}
