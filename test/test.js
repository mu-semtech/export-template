import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Hapi from 'hapi'
import parallel from 'mocha.parallel'
import routes from '../src/routes'

chai.use(chaiAsPromised)
const expect = chai.expect

/*
 * NOTE: you should use parallel here and not describe, otherwise the
 * injections will not work properly.
 *
 * See https://github.com/hapijs/hapi/issues/1299
 *
 */

const graph = 'http://mu.semte.ch/application'

parallel('mu-semtech-template', () => {
  let server
  const endpointUrl = 'http://mu.semte.ch/application'
  const request = (method, url, headers, content, callback) => {
    callback(null, {
      headers: {
        'content-type': 'application/json'
      },
      body: {method, url, headers, content},
      statusCode: 200
    })
  }
  const plugins = [
    {
      register: require('hapi-sparql'),
      options: {
        request,
        endpointUrl
      }
    }
  ]

  before(async () => {
    server = new Hapi.Server({debug: {request: []}})
    server.connection({})
    await server.register(plugins)
      .then((err) => {
        expect(err).to.be.not.ok
        server.route(routes)
      })
  })

  it('constructs with example1', () => {
    return expect(server.inject('/example1'))
      .to.eventually.be.fulfilled
      .to.eventually.have.deep.property('result.url')
      .to.eventually.be.equal(endpointUrl + '?query=' +
        encodeURIComponent('CONSTRUCT {?s ?p ?o} WHERE {?s ?p ?o}'))
  })

  it('constructs with example2', () => {
    return expect(server.inject('/example2'))
      .to.eventually.be.fulfilled
      .to.eventually.have.deep.property('result.url')
      .to.eventually.be.equal(endpointUrl + '?query=' +
          encodeURIComponent(`CONSTRUCT {?s ?p ?o} FROM <${graph}> WHERE {?s ?p ?o}`))
  })
})
