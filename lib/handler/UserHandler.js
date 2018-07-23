const User = require('../model/User');
const FutureBureau = require('../model/FutureBureau');
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

  // id, name, role
  static async getOneFutureBureau(stub, params) {
    const method = 'getOneFutureBureau';
    try {
      logger.enter(method);
      if (params.length !== 0) {
        logger.error('%s - Query FutureBureau requires params of length 0, found %s, %j', method, params.length, params);
        return Response(false, 'Create new FutureBureau requires params of length 0');
      }
      logger.debug('%s - Query FutureBureau', method);
      const futureBureau = await FutureBureau.Get(stub);
      logger.debug('%s - Successfully get FutureBureau from bc, response: %s', method, futureBureau.toString());
      logger.exit(method);
      return Response(true, futureBureau.toString());
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

      User.CHECK_CREATE_TOKEN_OPTIONS(createTokenRequest);
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

      User.CHECK_CREATE_FutureBureau_OPTIONS(createFutureBureauRequest);
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

  /**
   *
   * @param stub
   * @param params [to, name, amount]
   * @return {Promise<*>}
   */
  static async betTransfer(stub, params) {
    const method = 'betTransfer';
    try {
      logger.enter(method);
      logger.debug('%s - Bet Token with params %j', method, params);
      if (params.length !== 1) {
        logger.error('%s - Bet Token requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Bet Token requires params of length 1');
      }

      let BETTokenTransferRequest;
      try {
        BETTokenTransferRequest = JSON.parse(params[0]);
      } catch (e) {
        return Response(false, 'Can not parse request params[0] to a createTokenRequest Object');
      }

      logger.debug('%s - Bet Options:%j', method, BETTokenTransferRequest);
      User.CHECK_BETTRANSFER_OPTIONS(BETTokenTransferRequest);
      let user = await User.Get(stub);
      user = await user.betTransfer(stub, BETTokenTransferRequest);

      logger.debug('%s - Successfully transferred bet Token in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  /**
   *
   * @param stub
   * @param params [futurebureauName, result, amount]
   * @return {Promise<*>}
   */
  static async settle(stub, params) {
    const method = 'settle';
    try {
      logger.enter(method);
      logger.debug('%s - Settle with params %j', method, params);
      if (params.length !== 1) {
        logger.error('%s - Settle requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Settle requires params of length 1');
      }

      let settleRequest;
      try {
        settleRequest = JSON.parse(params[0]);
      } catch (e) {
        return Response(false, 'Can not parse request params[0] to a settleRequest Object');
      }

      logger.debug('%s - Settle Options:%j', method, settleRequest);
      User.CHECK_SETTLE_OPTIONS(settleRequest);
      const user = await User.Get(stub);
      user.judge(stub, params[0], params[1]); 
      const futureBureau = await FutureBureau.Get(stub);

      futureBureau.users.forEach((id) => {
        const futureBureauUser = futureBureau.users[id];
        futureBureauUser.bureau.futureBureaus.forEach((id2) => {
          const settleFutureBureau = futureBureauUser.bureau.futureBureaus[id2];
          if (settleFutureBureau === futureBureau) {
            if (settleFutureBureau.history.chooseOdds === params[1]) {
              const transferTokenRequest = {
                target: settleFutureBureau.history.from,
                futurebureauName: settleFutureBureau.name,
                tokenName: settleFutureBureau.history.tokenName,
                chooseOption: settleFutureBureau.history.chooseOption,
                chooseOdds: settleFutureBureau.history.chooseOdds,
                amount: settleFutureBureau.history.amount * settleFutureBureau.history.chooseOdds,
              };
              user.betTransfer(stub, transferTokenRequest);
            }
          }
        });
      });

      logger.debug('%s - Successfully settled in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}
module.exports = UserHandler;
