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

  // params[0]: userId
  // params[1]: newValue json string
  static async updateBureau(stub, params) {
    const method = 'updateBureau';
    try {
      logger.enter(method);
      if (params.length !== 2) {
        logger.error('%s - Update User requires params of length 2, found %s, %j', method, params.length, params);
        return Response(false, 'Update User requires params of length 2');
      }
      const opts = JSON.parse(params[1]);
      logger.debug('%s - Update User %s with newValue %j', method, params[0], opts);
      const user = await User.UpdateBureau(stub, params[0], opts);
      logger.debug('%s - Successfully Updated User at bc, response: %s', method, user.toString());
      logger.exit(method);
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  // params: [name, symbol, decimals, amount]
  static async createToken(stub, params) {
    const method = 'createToken';
    try {
      logger.enter(method);
      logger.debug('%s - Create new Token with params %j', method, params);
      if (params.length !== 1) {
        logger.error('%s - Create new Token requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Create new Token requires params of length 1');
      }
      let createTokenRequest;
      try {
        createTokenRequest = JSON.parse(params[0]);
      } catch (e) {
        return Response(false, 'Can not parse request params[0] to a createTokenRequest Object');
      }

      let user = await User.Get(stub);
      user = await user.createNewToken(createTokenRequest);

      logger.debug('%s - Successfully create new Token in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %s, stack: %O', method, e.message, e.stack);
      return Response(false, e.message);
    }
  }

  // params: [name, title, content, endTime, option1, option2, judgePerson, odd1, odd2, odd3]
  static async createFutureBureau(stub, params) {
    const method = 'createFutureBureau';
    try {
      logger.enter(method);
      logger.debug('%s - Create new FutureBureau with params %j', method, params);
      if (params.length !== 1) {
        logger.error('%s - Create new FutureBureau requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Create new FutureBureau requires params of length 1');
      }
      let createFutureBureauRequest;
      try {
        createFutureBureauRequest = JSON.parse(params[0]);
      } catch (e) {
        return Response(false, 'Can not parse request params[0] to a createFutureBureauRequest Object');
      }

      User.CHECK_CREATE_FUTUREBUREAU_OPTIONS(createFutureBureauRequest);
      let user = await User.Get(stub);
      user = await user.createNewFutureBureau(createFutureBureauRequest);

      logger.debug('%s - Successfully create new FutureBureau in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %s, stack: %O', method, e.message, e.stack);
      return Response(false, e.message);
    }
  }

  /**
   *
   * @param stub
   * @param params [to, name, amount]
   * @return {Promise<*>}
   */
  static async transfer(stub, params) {
    const method = 'transfer';
    try {
      logger.enter(method);
      logger.debug('%s - Transfer Token with params %j', method, params);
      if (params.length !== 1) {
        logger.error('%s - Transfer Token requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Transfer Token requires params of length 1');
      }

      let transferTokenRequest;
      try {
        transferTokenRequest = JSON.parse(params[0]);
      } catch (e) {
        return Response(false, 'Can not parse request params[0] to a createTokenRequest Object');
      }

      logger.debug('%s - Transfer Options:%j', method, transferTokenRequest);
      User.CHECK_TRANSFER_OPTIONS(transferTokenRequest);
      let user = await User.Get(stub);
      user = await user.transfer(transferTokenRequest);

      logger.debug('%s - Successfully transferred Token in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = UserHandler;
