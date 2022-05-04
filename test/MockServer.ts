import nock = require('nock')

export class MockServer {
  private _scope: nock.Scope

  public static readonly NOTIFICATION_SUBJECT = 'Document outdated: {{title}}'
  public static readonly NOTIFICATION_BODY = `<p>Hello {{author}}!</p>
                <p><br></p>
                <p>The document</p>
                <p>{{title}}</p>
                <p><br></p>
                <p>was last changed at {{lastVersionDate}}.</p>
                <p>{{#if lastVersionMessage}}</p>
                <p>The comment for the change was: {{lastVersionMessage}}</p>
                <p>{{/if}}</p>
                <p><br></p>
                <p>You can find the document here: {{url}}</p>
  `

  constructor(basePath: string) {
    this._scope = nock(basePath)
  }

  public addConfigurationDocumentEndpoint(): void {
    this._scope
      .get('/rest/api/content/12345?expand=body.storage')
      .basicAuth({
        user: 'nobody',
        pass: 'nothing',
      })
      .reply(200, {
        body: {
          storage: {
            value: `
          <ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='4671afbe-d914-470a-bb9e-8b7321f60f79'>
    <ac:parameter ac:name='title'>Configuration</ac:parameter>
    <ac:rich-text-body>
        <table class='wrapped'>
            <colgroup>
                <col/>
                <col/>
            </colgroup>
            <tbody>
            <tr>
                <th>Space</th>
                <td>SAMPLE</td>
            </tr>
            <tr>
                <th>Domain</th>
                <td>example.com</td>
            </tr>
            <tr>
                <th>NotificationFrom</th>
                <td>Notification &lt;noreply@example.com&gt;</td>
            </tr>
            </tbody>
        </table>
    </ac:rich-text-body>
</ac:structured-macro>
<ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='ecfe796e-b701-4f30-a74a-b94dbb33daff'>
    <ac:parameter ac:name='title'>SMTP</ac:parameter>
    <ac:rich-text-body>
        <table>
            <colgroup>
                <col/>
                <col/>
            </colgroup>
            <tbody>
            <tr>
                <th>Host</th>
                <td colspan='1'>localhost</td>
            </tr>
            <tr>
                <th>Port</th>
                <td colspan='1'>25</td>
            </tr>
            </tbody>
        </table>
    </ac:rich-text-body>
</ac:structured-macro>
<ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='f19cd8b2-57e0-4c68-a823-8a2daee08c12'>
    <ac:parameter ac:name='title'>Checks</ac:parameter>
    <ac:rich-text-body>
        <table class='wrapped'>
            <colgroup>
                <col/>
                <col/>
            </colgroup>
            <tbody>
            <tr>
                <th>Labels</th>
                <th>MaxAge</th>
            </tr>
            <tr>
                <td>test1</td>
                <td>356</td>
            </tr>
            <tr>
                <td colspan='1'>test2</td>
                <td colspan='1'>1234</td>
            </tr>
            </tbody>
        </table>
    </ac:rich-text-body>
</ac:structured-macro>
<ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='1d192d60-7e69-4af8-8dd6-4006a7bfc952'>
    <ac:parameter ac:name='title'>Maintainer</ac:parameter>
    <ac:rich-text-body>
        <table class='wrapped'>
            <colgroup>
                <col/>
                <col/>
            </colgroup>
            <tbody>
            <tr>
                <th>Pagepattern</th>
                <th>Maintainer</th>
            </tr>
            <tr>
                <td>main/Test/.*</td>
                <td>maintainer,_lastauthor</td>
            </tr>
            </tbody>
        </table>
    </ac:rich-text-body>
</ac:structured-macro>
<ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='1d192d60-7e69-4af8-8dd6-4006a7bfc952'>
    <ac:parameter ac:name='title'>Exceptions</ac:parameter>
    <ac:rich-text-body>
        <table class='wrapped'>
            <colgroup>
                <col/>
            </colgroup>
            <tbody>
            <tr>
                <th>RegularExpression</th>
            </tr>
            <tr>
                <td>main/Test/NOT</td>
            </tr>
            </tbody>
        </table>
    </ac:rich-text-body>
</ac:structured-macro>
<ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='93f1d981-c841-4cb4-b6e2-5940dfe69132'>
    <ac:parameter ac:name='title'>Notification Template</ac:parameter>
    <ac:rich-text-body>
        <ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='f8503e48-c671-4ed6-897c-def2b2c3fa29'>
            <ac:parameter ac:name='title'>Subject</ac:parameter>
            <ac:rich-text-body><p>${MockServer.NOTIFICATION_SUBJECT}</p></ac:rich-text-body>
        </ac:structured-macro>
        <ac:structured-macro ac:name='panel' ac:schema-version='1' ac:macro-id='63c16112-dea3-434e-b1cb-467ff4e36d5f'>
            <ac:parameter ac:name='title'>Body</ac:parameter>
            <ac:rich-text-body>${MockServer.NOTIFICATION_BODY}</ac:rich-text-body>
        </ac:structured-macro>
    </ac:rich-text-body>
</ac:structured-macro>
          `,
          },
        },
      })
  }

  public addSearchEndpoint(): void {
    this._scope
      .get(new RegExp('/rest/api/content/search\\?cql=.+&start=0'))
      .basicAuth({
        user: 'nobody',
        pass: 'nothing',
      })
      .reply(200, {
        results: [
          {
            id: 123,
          },
        ],
        start: 0,
        size: 1,
        totalSize: 2,
      })
      .get(new RegExp('/rest/api/content/search\\?cql=.+&start=1'))
      .basicAuth({
        user: 'nobody',
        pass: 'nothing',
      })
      .reply(200, {
        results: [
          {
            id: 234,
          },
        ],
        start: 1,
        size: 1,
        totalSize: 2,
      })
  }

  public addDocumentEndpoint(): void {
    this._scope
      .get('/rest/api/content/123?expand=ancestors')
      .basicAuth({
        user: 'nobody',
        pass: 'nothing',
      })
      .reply(200, {
        _links: {
          base: 'https://example.com',
          webui: '/display/SAMPLE/Test',
        },
        ancestors: [
          {
            title: 'main',
          },
        ],
        version: {
          by: {
            username: 'author',
          },
          when: '2020-01-01T00:00:00.000+02:00',
          message: 'Some change',
        },
        title: 'Test',
      })
      .get('/rest/api/content/234?expand=ancestors')
      .basicAuth({
        user: 'nobody',
        pass: 'nothing',
      })
      .reply(200, {
        _links: {
          base: 'https://example.com',
          webui: '/display/SAMPLE/Test2',
        },
        ancestors: [
          {
            title: 'main',
          },
          {
            title: 'Test',
          },
        ],
        version: {
          by: {
            username: 'author2',
          },
          when: '2020-02-01T00:00:00.000+02:00',
        },
        title: 'Test2',
      })
  }

  public addCreateEndpoint(): void {
    this._scope
      .post('/rest/api/content')
      .basicAuth({
        user: 'nobody',
        pass: 'nothing',
      })
      .reply(200, (uri, requestBody) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestObject = requestBody as Record<string, any>
        requestObject.id = '12345'
        return requestObject
      })
  }
}
