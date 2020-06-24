import 'mocha'
import { Configuration } from '../lib/api/configuration'
import { MockServer } from './MockServer'
import chai = require('chai')
import chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

describe('The Configuration API', (): void => {
  it('should load a list of checks', async (): Promise<void> => {
    const mockServer = new MockServer('https://example.com')
    mockServer.addConfigurationDocumentEndpoint()

    const configuration = new Configuration('https://example.com', 'nobody', 'nothing', '12345')
    await configuration.load()
    chai.expect(configuration.checks).to.have.lengthOf(2)
    chai.expect(configuration.checks[0].labels).to.contain('test1')
    chai.expect(configuration.checks[0].maxAge).to.eq(356)
    chai.expect(configuration.checks[1].labels).to.contain('test2')
    chai.expect(configuration.checks[1].maxAge).to.eq(1234)

    chai.expect(configuration.notificationBodyTemplate).to.eq(MockServer.NOTIFICATION_BODY)
    chai.expect(configuration.notificationSubjectTemplate).to.eq(MockServer.NOTIFICATION_SUBJECT)

    chai.expect(configuration.transportOptions.host).to.eq('localhost')
    chai.expect(configuration.transportOptions.port).to.eq('25')
  })
})
