/* eslint-disable class-methods-use-this */
const shim = require('fabric-shim');

const logger = require('./lib/utils/Logger').getLogger('Earth:index.js');

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
        return shim.success(Buffer.from('success'));
      case 'user.create':
        return shim.success(Buffer.from('create user success'));
      default:
        return shim.error(Buffer.from(`${fcn} is not a valid function name`));
    }
  }
}

shim.start(new Chaincode());
