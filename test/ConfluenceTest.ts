import 'mocha'
import { Confluence } from '../lib/api/Confluence'
import { MockServer } from './MockServer'
import chai = require('chai')
import chaiAsPromised = require('chai-as-promised')
import { Moment } from 'moment'

chai.use(chaiAsPromised)

describe('The Confluence API', (): void => {
  it('should search for old documents', async (): Promise<void> => {
    const mockServer = new MockServer('https://example.com')
    mockServer.addSearchEndpoint()
    mockServer.addDocumentEndpoint()
    const confluence = new Confluence('https://example.com', 'nobody', 'nothing')
    const results = await confluence.findDocumentsOlderThan('', 1, 1)
    chai.expect(results).to.have.lengthOf(2)
    chai.expect(results[0].url).to.eq('https://example.com/display/SAMPLE/Test')
    chai.expect(results[0].author).to.eq('author')
    chai.expect(results[0].id).to.eq(123)
    chai.expect((results[0].lastVersionDate as Moment).toISOString()).to.eq('2019-12-31T22:00:00.000Z')
    chai.expect(results[0].lastVersionMessage).to.eq('Some change')
    chai.expect(results[0].title).to.eq('Test')
    chai.expect(results[1].url).to.eq('https://example.com/display/SAMPLE/Test2')
    chai.expect(results[1].author).to.eq('author2')
    chai.expect(results[1].id).to.eq(234)
    chai.expect((results[1].lastVersionDate as Moment).toISOString()).to.eq('2020-01-31T22:00:00.000Z')
    chai.expect(results[1].lastVersionMessage).to.eq('')
    chai.expect(results[1].title).to.eq('Test2')
  })

  it('should add a configuration document', async (): Promise<void> => {
    const mockServer = new MockServer('https://example.com')
    mockServer.addCreateEndpoint()
    const confluence = new Confluence('https://example.com', 'nobody', 'nothing')
    const result = await confluence.createConfigurationDocument('example', 'test', '0123')
    chai.expect(result).to.eq('12345')
  })
})
