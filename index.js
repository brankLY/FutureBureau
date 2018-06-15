/* eslint-disable class-methods-use-this */
const shim = require('fabric-shim');

const logger = require('./lib/utils/Logger').getLogger('Earth:index.js');
const User = require('./lib/model/User');
const Response = require('./lib/utils/Response');

const UserHandler = require('./lib/handler/UserHandler');

class Chaincode {
  async Init(stub) {
    const method = 'init';
    logger.enter(method);
    try {
      logger.debug('Create init Admin Users');
      const bootstrapUser = {
        id: 'Admin@org1.example.com',
        role: 'admin',
        name: 'Earth BlockChain Bootstrap User',
      };
      const user = await User.Create(stub, bootstrapUser);
      logger.debug('Successfully Created Bootstrap Earth Admin');
      logger.exit(method);
      return Response(true, user.toString());
    } catch (e) {
      return Response(false, e.message);
    }
  }

  async Invoke(stub) {
    logger.debug('############## Invoke Start ##############');
    const {
      fcn,
      params,
    } = stub.getFunctionAndParameters();
    logger.debug('Invoke with fcn:%s and params:%j', fcn, params);
    switch (fcn) {
      case 'user.query':
        return UserHandler.getOne(stub, params);
      case 'user.create':
        return UserHandler.create(stub, params);
      case 'user.update':
        return UserHandler.update(stub, params);
      default:
        return shim.error(Buffer.from(`${fcn} is not a valid function name`));
    }
  }
}

shim.start(new Chaincode());
