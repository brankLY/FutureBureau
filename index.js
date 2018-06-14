/* eslint-disable class-methods-use-this */
const shim = require('fabric-shim');

const logger = require('./lib/utils/Logger').getLogger('Earth:index.js');
const createUser = require('./lib/handler/user.create');
const queryUser = require('./lib/handler/user.query');
class Chaincode {
  async Init(stub) {
    const method = 'init';
    logger.enter(method);
    logger.exit(method);
    return shim.success();
  }

  async Invoke(stub) {
    const method = 'invoke';
    logger.enter(method);
    const {
      fcn,
      params,
    } = stub.getFunctionAndParameters();
    switch (fcn) {
      case 'user.query':
        return queryUser(stub, params);
      case 'user.create':
        return createUser(stub, params);
      default:
        return shim.error(Buffer.from(`${fcn} is not a valid function name`));
    }
  }
}

shim.start(new Chaincode());
