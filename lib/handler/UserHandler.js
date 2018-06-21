const User = require('../model/User');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');

class UserHandler {
  // params[0]: id
  // params[1]: name
  static async create(stub, params) {
    const method = 'create';
    try {
      logger.enter(method);
      if (params.length !== 2) {
        logger.error('%s - Create new User requires params of length 2, found %s, %j', method, params.length, params);
        return Response(false, 'Create new User requires params of length 2');
      }
      const opts = {
        id: params[0],
        name: params[1],
        role: 'user',
      };
      logger.debug('%s - Create new User with options %j', method, opts);
      const user = await User.Create(stub, opts);
      logger.debug('%s - Successfully create new User in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  // id, name, role
  static async getOne(stub, params) {
    const method = 'getOne';
    try {
      logger.enter(method);
      if (params.length !== 0) {
        logger.error('%s - Query User requires params of length 0, found %s, %j', method, params.length, params);
        return Response(false, 'Create new User requires params of length 0');
      }
      logger.debug('%s - Query User', method);
      const user = await User.Get(stub);
      logger.debug('%s - Successfully get User from bc, response: %s', method, user.toString());
      logger.exit(method);
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  // params[0]: userId
  // params[1]: newValue json string
  static async update(stub, params) {
    const method = 'update';
    try {
      logger.enter(method);
      if (params.length !== 2) {
        logger.error('%s - Update User requires params of length 2, found %s, %j', method, params.length, params);
        return Response(false, 'Update User requires params of length 2');
      }
      const opts = JSON.parse(params[1]);
      logger.debug('%s - Update User %s with newValue %j', method, params[0], opts);
      const user = await User.Update(stub, params[0], opts);
      logger.debug('%s - Successfully Updated User at bc, response: %s', method, user.toString());
      logger.exit(method);
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  // params[0]: serialized token info
  static async createToken(stub, params) {
    const method = 'createToken';
    try {
      logger.enter(method);
      logger.debug('%s - Create new Token with params %j', method, params);
      if (params.length !== 4) {
        logger.error('%s - Create new Token requires params of length 4, [name, symbol, decimals, amount] , found %s, %j', method, params.length, params);
        return Response(false, 'Create new User requires params of length 4');
      }

      let user = await User.Get(stub);
      user = await user.createNewToken(params);

      logger.debug('%s - Successfully create new Token in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = UserHandler;
