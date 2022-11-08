// workaround: require config-netlify to make sure it gets added to the netlify bundle
require('dotenv').config()

const appPort = process.env.SERVER_PORT || 3000;

module.exports = {
  policyRoot: process.env.REACT_APP_POLICY_ROOT || 'peoplefinder',
  instanceName: process.env.POLICY_INSTANCE_NAME,
  instanceLabel: process.env.POLICY_INSTANCE_LABEL,
  authorizerServiceUrl: process.env.AUTHORIZER_SERVICE_URL || `authorizer.prod.aserto.com:8443`,
  authorizerApiKey: process.env.AUTHORIZER_API_KEY,
  authorizerCertCAFile: process.env.AUTHORIZER_CERT_CA_FILE,
  directoryServiceUrl: process.env.DIRECTORY_SERVICE_URL || `directory.prod.aserto.com:8443`,
  directoryApiKey: process.env.DIRECTORY_API_KEY,
  directoryCertCAFile: process.env.DIRECTORY_CERT_CA_FILE,
  tenantId: process.env.TENANT_ID,

  domain: process.env.REACT_APP_DOMAIN,
  jwksUri: `https://${process.env.REACT_APP_DEX_DOMAIN}/dex/keys`,
  issuer: `https://${process.env.REACT_APP_DEX_DOMAIN}/dex`,
  audience: process.env.REACT_APP_DEX_AUDIENCE,

  port: process.env.API_PORT || 3001,
  appPort,
  appOrigin: process.env.APP_ORIGIN || `http://localhost:${appPort}`,
}
