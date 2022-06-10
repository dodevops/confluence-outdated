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
  let mockServer, configuration, confluence, transportStub

  beforeEach(async () => {
    mockServer = new MockServer('https://example.com')
    mockServer.addConfigurationDocumentEndpoint()
    mockServer.addSearchEndpoint()
    mockServer.addDocumentEndpoint()
    configuration = new Configuration('https://example.com', 'nobody', 'nothing', '12345')
    await configuration.load()
    confluence = new Confluence('https://example.com', 'nobody', 'nothing')
    transportStub = sinon.createStubInstance(Mail.prototype.constructor, {
      sendMail: sinon.stub().resolves(),
    }) as Mail
  })

  it('should send notifications', async (): Promise<void> => {
    const notification = new Notification(configuration, '', confluence, transportStub)
    const documentInfo = new DocumentInfo(0, 'author', moment(), 'message', 'title', ['main'], 'http://example.com', 'test')
    await notification.notify([documentInfo])
    chai.expect((transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledOnce).to.be.true
    chai.expect(
      (transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledWith({
        from: 'Notification <noreply@example.com>',
        to: 'author@example.com',
        subject: Handlebars.compile(MockServer.NOTIFICATION_SUBJECT)({
          author: 'author@example.com',
          documentsCount: 1,
          documents: [documentInfo],
          multipleDocuments: false,
        }),
        html: Handlebars.compile(MockServer.NOTIFICATION_BODY)({
          author: 'author@example.com',
          documentsCount: 1,
          documents: [documentInfo],
          multipleDocuments: false,
        }),
      })
    ).to.be.true
  })
  it('should use a maintainer when configured', async (): Promise<void> => {
    const notification = new Notification(configuration, '', confluence, transportStub)
    const documentInfo = new DocumentInfo(0, 'author2', moment(), 'message', 'Test2', ['main', 'Test'], 'http://example.com', 'test')
    await notification.notify([documentInfo])
    chai.expect((transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledTwice).to.be.true
    chai.expect(
      (transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledWith({
        from: 'Notification <noreply@example.com>',
        to: 'maintainer@example.com',
        subject: Handlebars.compile(MockServer.NOTIFICATION_SUBJECT)({
          author: 'maintainer@example.com',
          documentsCount: 1,
          documents: [documentInfo],
          multipleDocuments: false,
        }),
        html: Handlebars.compile(MockServer.NOTIFICATION_BODY)({
          author: 'maintainer@example.com',
          documentsCount: 1,
          documents: [documentInfo],
          multipleDocuments: false,
        }),
      })
    ).to.be.true
    chai.expect(
      (transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledWith({
        from: 'Notification <noreply@example.com>',
        to: 'author2@example.com',
        subject: Handlebars.compile(MockServer.NOTIFICATION_SUBJECT)({
          author: 'author2@example.com',
          documentsCount: 1,
          documents: [documentInfo],
          multipleDocuments: false,
        }),
        html: Handlebars.compile(MockServer.NOTIFICATION_BODY)({
          author: 'author2@example.com',
          documentsCount: 1,
          documents: [documentInfo],
          multipleDocuments: false,
        }),
      })
    ).to.be.true
  })
  it('should not send notifications on a dry run', async (): Promise<void> => {
    const notification = new Notification(configuration, '', confluence, transportStub, true)
    const documentInfo = new DocumentInfo(0, 'author', moment(), 'message', 'title', ['main'], 'http://example.com', 'test')
    await notification.notify([documentInfo])
    chai.expect((transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.notCalled).to.be.true
  })
  it('should not send notifications for an excluded document', async (): Promise<void> => {
    const notification = new Notification(configuration, '', confluence, transportStub)
    const documentInfo = new DocumentInfo(0, 'author2', moment(), 'message', 'NOT', ['main', 'Test'], 'http://example.com', 'test')
    await notification.notify([documentInfo])
    chai.expect((transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledOnce).to.be.false
  })

  it('should send notifications in a batch if configured', async (): Promise<void> => {
    const notification = new Notification(configuration, '', confluence, transportStub)
    const documentInfo = new DocumentInfo(0, 'author', moment(), 'message', 'title1', ['main'], 'http://example.com', 'test')
    const documentInfo2 = new DocumentInfo(0, 'author', moment(), 'message', 'title2', ['main'], 'http://example.com', 'test')
    await notification.notify([documentInfo, documentInfo2])
    chai.expect((transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledOnce).to.be.true
    chai.expect(
      (transportStub as unknown as SinonStubbedInstance<Mail>).sendMail.calledWith({
        from: 'Notification <noreply@example.com>',
        to: 'author@example.com',
        subject: Handlebars.compile(MockServer.NOTIFICATION_SUBJECT)({
          author: 'author@example.com',
          documentsCount: 2,
          documents: [documentInfo, documentInfo2],
          multipleDocuments: true,
        }),
        html: Handlebars.compile(MockServer.NOTIFICATION_BODY)({
          author: 'author@example.com',
          documentsCount: 2,
          documents: [documentInfo, documentInfo2],
          multipleDocuments: true,
        }),
      })
    ).to.be.true
  })
})
