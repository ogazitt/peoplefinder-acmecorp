// directory management API utility functions

// exports:
//   getUser(userId): get a user's profile
//   getUsers(): get all users
//   updateUser(userId): update a user's user and app metadata fields

const { ds } = require('@aserto/aserto-node');
const { directoryServiceUrl, tenantId, directoryApiKey } = require('./config');

const directoryClient = ds({
  url: directoryServiceUrl,
  tenantId,
  apiKey: directoryApiKey,
})

// get a user's profile from the management API
exports.getUser = async (_req, identity) => {
  try {
    const relation = await directoryClient.relation(
      {
        subject: {
          type: 'user',
        },
        object: {
          type: 'identity',
          key: identity
        },
        relation: {
          name: 'identifier',
          objectType: 'identity'
        }
      }
    )
    if (!relation || relation.length === 0) {
      throw new Error(`No relations found for identity ${identity}`, )
    }

    const user = await directoryClient.object(relation[0].subject);
    const managerObject = await manager(user.key)
    const userProps = user.properties.toJson()
    userProps['manager'] = managerObject.key
    user.properties.fromJson(userProps)
    return user
  } catch (error) {
    console.error(`getUser: caught exception: ${error}`);
    return null;
  }
}

// get users
exports.getUsers = async (req) => {
  try {
    let users = []
    let page =  { size: 100 }
    while(true) {
      let response = await directoryClient.objects({ objectType: { name: 'user'}, page: page})
      users = users.concat(response.results)
      const nextToken = response.page.nextToken
      if(nextToken === ""){
        break;
      }
      page = { size: 100, token: nextToken }
    }
    return users
  } catch (error) {
    console.error(`getUsers: caught exception: ${error}`);
    return null;
  }
}

// update a user
exports.updateUser = async (req, user, payload) => {
  try {
    const response = await directoryClient.setObject(payload)
    return response
  } catch (error) {
    console.error(`updateUser: caught exception: ${error}`);
    return null;
  }
}

// // delete a user
exports.deleteUser = async (req, user) => {
  // not implemented
  return null;
}


// get an user's manager
async function manager ( userKey) {
  try {
    const relation = await directoryClient.relation(
      {
        subject: {
          type: 'user',
          key: userKey,
        },
        object: {
          type: 'user',
        },
        relation: {
          name: 'manager',
          objectType: 'user'
        }
      }
    )
    if (!relation || relation.length === 0) {
      throw new Error(`No relations found for user: ${userKey}`, )
    }

    const manager = await directoryClient.object(relation[0].object);
    return manager
  } catch (error) {
    console.error(`manager: caught exception: ${error}`);
    return null;
  }
}
