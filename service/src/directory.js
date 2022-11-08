// directory management API utility functions

// exports:
//   getUser(userId): get a user's profile
//   getUsers(): get all users
//   updateUser(userId): update a user's user and app metadata fields

const grpc =  require("@grpc/grpc-js");
const { Struct } = require("google-protobuf/google/protobuf/struct_pb");
const dsc = require("@aserto/node-directory/pkg/aserto/directory/common/v2/common_pb");
// const { Object as DirObject, ObjectIdentifier, ObjectTypeIdentifier } = require("@aserto/node-directory/pkg/aserto/directory/common/v2/common_pb");
const { GetObjectRequest, GetObjectsRequest } = require("@aserto/node-directory/pkg/aserto/directory/reader/v2/reader_pb");
const { ReaderClient } = require("@aserto/node-directory/pkg/aserto/directory/reader/v2/reader_grpc_pb");

const { SetObjectRequest  } = require("@aserto/node-directory/pkg/aserto/directory/writer/v2/writer_pb");
const { WriterClient } = require("@aserto/node-directory/pkg/aserto/directory/writer/v2/writer_grpc_pb");

const grpc_promise = require('grpc-promise');
const { directoryServiceUrl, directoryCertCAFile, tenantId, directoryApiKey } = require('./config');

const reader = new ReaderClient(directoryServiceUrl, grpc.credentials.createSsl());
const writer = new WriterClient(directoryServiceUrl, grpc.credentials.createSsl());

const meta = new grpc.Metadata();
meta.add('authorization', `basic ${directoryApiKey}`);
meta.add("aserto-tenant-id", tenantId);

grpc_promise.promisifyAll(reader, {metadata: meta});
grpc_promise.promisifyAll(writer, {metadata: meta});

// get a user's profile from the management API
exports.getUser = async (req, user) => {
  try {
    let objIdentifier = new dsc.ObjectIdentifier();
    objIdentifier.setId(user);
    let request = new GetObjectRequest();
    request.setParam(objIdentifier);

    const response = await reader.getObject().sendMessage(request);

    return dumpObject(response.getResult());
  } catch (error) {
    console.error(`getUser: caught exception: ${error}`);
    return null;
  }
}

// get users
exports.getUsers = async (req) => {
  try {
    let objectTypeIdentifier = new dsc.ObjectTypeIdentifier();
    objectTypeIdentifier.setName("user");
    let request = new GetObjectsRequest();
    request.setParam(objectTypeIdentifier);


    let users = [];

    while (true) {
      const response = await reader.getObjects().sendMessage(request)
      users = users.concat(response.getResultsList().map(dumpObject));

      const nextToken = response.getPage().getNextToken();
      if (nextToken === "") {
        break;
      }

      let nextPage = new dsc.PaginationRequest();
      nextPage.setToken(nextToken);
      request.setPage(nextPage);
    }

    return users;

  } catch (error) {
    console.error(`getUsers: caught exception: ${error}`);
    return null;
  }
}

// update a user
exports.updateUser = async (req, user, payload) => {
  try {
    const userObj = loadObject(payload);
    let request = new SetObjectRequest();
    request.setObject(userObj);
    let response = await writer.setObject().sendMessage(request);
    return dumpObject(response.getResult());
  } catch (error) {
    console.error(`updateUser: caught exception: ${error}`);
    return null;
  }
}

// delete a user
exports.deleteUser = async (req, user) => {
  // not implemented
  return null;
}

function dumpObject(obj) {
    let result = obj.toObject();
    result.properties = obj.getProperties().toJavaScript();
    return result;
}

function loadObject(input) {
  let obj = new dsc.Object();
  obj.setId(input.id);
  obj.setKey(input.key);
  obj.setType(input.type);
  obj.setDisplayName(input.displayName);
  obj.setHash(input.hash);

  // let props = Struct.fromJavaScript(Object.entries(input.properties));
  let props = Struct.fromJavaScript(input.properties);
  obj.setProperties(props)

  return obj
}
