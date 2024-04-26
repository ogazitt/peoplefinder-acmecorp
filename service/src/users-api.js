const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { displayStateMap, is, Authorizer, Middleware, SubIdentityMapper, JWTIdentityMapper } = require('@aserto/aserto-node');
const directory = require('./directory');
const {
  policyRoot,
  instanceName,
  instanceLabel,
  authorizerServiceUrl,
  authorizerApiKey,
  tenantId,
  authorizerCertCAFile,
  audience,
  jwksUri,
  issuer
} = require('./config');

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri
  }),
  audience,
  issuer,
  algorithms: ["RS256"]
});

const authzOptions = {
  authorizerServiceUrl,
  instanceName,
  instanceLabel,
  policyRoot,
};
if (authorizerApiKey) {
  authzOptions.authorizerApiKey = authorizerApiKey;
}
if (tenantId) {
  authzOptions.tenantId = tenantId;
}
if (authorizerCertCAFile) {
  authzOptions.authorizerCertCAFile = authorizerCertCAFile;
}

console.log("authzOptions", authzOptions)



const authClient = new Authorizer({
  authorizerServiceUrl: authzOptions.authorizerServiceUrl,
  authorizerApiKey: authzOptions.authorizerApiKey,
  tenantId: authzOptions.tenantId,
  authorizerCertCAFile: authorizerCertCAFile,
})

const middleware = new Middleware({
  client: authClient,
  policy: {
    name: authzOptions.instanceName,
    instanceLabel: authzOptions.instanceLabel,
    root: authzOptions.policyRoot,
  },
  identityMapper: async (req) => {
    let mapper = JWTIdentityMapper()
    if(req.headers['identity']){
       mapper = SubIdentityMapper('identity')
    }

    return mapper(req)
  },
})
// register routes for users API
exports.register = (app) => {
  // set up middleware to return the display state map for this service
  app.use(displayStateMap(authzOptions));

  // use middleware.Authz() as middleware in the route dispatch path
  app.get("/api/users", checkJwt, middleware.Authz(), async (req, res) => {
    const users = await directory.getUsers(req);
    if (users) {
      res.status(200).json(users);
    } else {
      res.status(403).send('something went wrong');
    }
  });

  app.get("/api/users/:id", checkJwt, middleware.Authz(), async (req, res) => {
    const id = req.params.id;
    const user = await directory.getUser(req, id);
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(403).send('something went wrong');
    }
  });

  // edit phone
  app.put("/api/users/:id", checkJwt, middleware.Authz(), async (req, res) => {
    const user = req.body;
    const id = req.params.id;
    const response = await directory.updateUser(req, id, user);
    if (response) {
      res.status(201).send(response);
    } else {
      res.status(403).send('something went wrong');
    }
  });

  // update department and title
  app.post("/api/users/:id", checkJwt, middleware.Authz(), async (req, res) => {
    const user = req.body;
    const id = req.params.id;
    const response = await directory.updateUser(req, id, user);
    if (response) {
      res.status(201).send(response);
    } else {
      res.status(403).send('something went wrong');
    }
  });

  // delete the user
  // instead of middleware.Authz(), use the "is" function for a more imperative style of authorization
  app.delete("/api/users/:id", checkJwt, /* middleware.Authz(),*/ async (req, res) => {
    const id = req.params.id;

    try {
      // call the is('allowed') method, inferring the policy name and resource
      const allowed = await is('allowed', req, authzOptions);
      if (allowed) {
        const response = await directory.deleteUser(req, id);
        if (response) {
          res.status(201).send(response);
        } else {
          res.status(403).send('something went wrong');
        }
      } else {
        res.status(403).send('Not Authorized');
      }
    }
    catch (error) {
      res.status(403).send(`Not Authorized: exception ${error.message}`);
    }
  });
}
