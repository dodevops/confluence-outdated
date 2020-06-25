import 'mocha'
import { Configuration } from '../lib/api/Configuration'
import { MockServer } from './MockServer'
import chai = require('chai')
import chaiAsPromised = require('chai-as-promised')
import { Confluence } from '../lib/api/Confluence'
import { Notification } from '../lib/api/Notification'
import * as Mail from 'nodemailer/lib/mailer'
import sinon = require('sinon')
import { DocumentInfo } from '../lib/api/DocumentInfo'
import { SinonStubbedInstance } from 'sinon'
import moment = require('moment')
import * as Handlebars from 'handlebars'

chai.use(chaiAsPromised)

describe('The Notification API', (): void => {
  it('should send notifications', async (): Promise<void> => {
    const mockServer = new MockServer('https://example.com')
    mockServer.addConfigurationDocumentEndpoint()
    mockServer.addSearchEndpoint()
    mockServer.addDocumentEndpoint()
    const configuration = new Configuration('https://example.com', 'nobody', 'nothing', '12345')
    await configuration.load()
    const confluence = new Confluence('https://example.com', 'nobody', 'nothing')
    const transportStub = sinon.createStubInstance(Mail.prototype.constructor, {
      sendMail: sinon.stub().resolves(),
    }) as Mail
    const notification = new Notification(configuration, confluence, transportStub)
    const documentInfo = new DocumentInfo(0, 'author', moment(), 'message', 'title', 'http://example.com')
    await notification.notify(documentInfo)
    chai.expect(((transportStub as unknown) as SinonStubbedInstance<Mail>).sendMail.calledOnce).to.be.true
    chai.expect(
      ((transportStub as unknown) as SinonStubbedInstance<Mail>).sendMail.calledWith({
        from: 'Notification <noreply@example.com>',
        to: 'author@example.com',
        subject: Handlebars.compile(MockServer.NOTIFICATION_SUBJECT)(documentInfo),
        html: Handlebars.compile(MockServer.NOTIFICATION_BODY)(documentInfo),
      })
    ).to.be.true
  })
})
