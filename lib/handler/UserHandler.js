const util = require('util');
const User = require('../model/User');
const FutureBureau = require('../model/FutureBureau');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');

const EARTH_CHAINCODE_ID = 'e24ea80d-d703-47a3-88af-1c69f21b025d';
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
      const createRequest = {
        id: params[0],
        name: params[1],
        role: 'user',
      };
      await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['account.create', JSON.stringify(createRequest)]);
      logger.debug('%s - Create new User with options %j', method, createRequest);
      const user = await User.Create(stub, createRequest);
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
        return Response(false, 'Query new User requires params of length 0');
      }
      logger.debug('%s - Query User', method);
      const user = await User.Get(stub);
      logger.debug('%s - Successfully get User from bc, response: %s', method, user.toString());
      logger.exit(method);
      return Response(true, JSON.stringify(user));
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
      if (params.length !== 1) {
        logger.error('%s - Query FutureBureau requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Create new FutureBureau requires params of length 1');
      }
      const queryBureauRequest = JSON.parse(params[0]);
      logger.debug('%s - Query FutureBureau', queryBureauRequest);
      const futureBureau = await FutureBureau.Get(stub, queryBureauRequest);
      logger.debug('%s - Successfully get FutureBureau from bc, response: %j', method, futureBureau);
      logger.exit(method);
      return Response(true, futureBureau);
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
  static async transfer(stub, params) {
    const method = 'transfer';
    try {
      logger.enter(method);
      logger.debug('%s - Transfer Token with params %j', method, params);
      if (params.length !== 1) {
        logger.error('%s - Transfer Token requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Transfer Token requires params of length 1');
      }
      logger.debug('%s - Transfer Token with params %j+++++%s', method, params[0], params[0]);
      const account = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['wallet.transfer', params[0]]);
      logger.debug('- invokeChaincode Options:%j', account);
      const user = await User.Get(stub);
      logger.debug('%s - Successfully transferred Token in bc, response: %s', method, user.toString());
      return Response(true, JSON.stringify(user));
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
    let BETTokenTransferRequest;
    try {
      BETTokenTransferRequest = JSON.parse(params[0]);
    } catch (e) {
      return Response(false, 'Can not parse request params[0] to a createTokenRequest Object');
    }
    try {
      const contractAccountId = (await stub.getState('Dapp_futurebureau')).toString('utf8');
      logger.debug('%s - contractAccountId %s', method, contractAccountId);
      const transferTokenRequest = {
        symbol: 'GZH',
        target: contractAccountId,
        amount: Number(BETTokenTransferRequest.amount),
        metadata: 'betTransfer to contract account',
      };
      const targetBureau = await FutureBureau.Get(stub, BETTokenTransferRequest);
      if (targetBureau.result !== 'Undecided') {
        logger.error('FutureBureau %s already judeged', targetBureau.name);
        throw new Error(util.format('FutureBureau %s already judeged', targetBureau.name));
      }
      await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['wallet.transfer', JSON.stringify(transferTokenRequest)]);
      logger.debug('%s - Bet Options:%j', method, BETTokenTransferRequest);
      User.CHECK_BETTRANSFER_OPTIONS(BETTokenTransferRequest);
      let user = await User.Get(stub);
      user = User.FROM_JSON(stub, user);
      user = await user.betTransfer(BETTokenTransferRequest);
      logger.debug('%s - Successfully transferred bet Token in bc, response: %s', method, user.toString());
      return Response(true, JSON.stringify(user));
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
      if (params.length !== 1) {
        logger.error('%s - Update User requires params of length 2, found %s, %j', method, params.length, params);
        return Response(false, 'Update User requires params of length 2');
      }
      const account = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['account.update', params[0]]);
      logger.debug('%s - Update User %s with newValue %j', method, account.payload);
      // const user = await User.Update(stub, params[0], opts);
      const user = await User.Get(stub, account.payload.id);
      logger.debug('%s - Successfully Updated User at bc, response: %s', method, user.toString());
      logger.exit(method);
      return Response(true, JSON.stringify(user));
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
      return Response(true, JSON.stringify(user));
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
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
      logger.debug('%s -createFutureBureauRequest is : %j', method, createFutureBureauRequest);
      User.CHECK_CREATE_FUTUREBUREAU_OPTIONS(createFutureBureauRequest);
      let user = await User.Get(stub);
      user = User.FROM_JSON(stub, user);
      user = await user.createNewFutureBureau(createFutureBureauRequest);

      logger.debug('%s - Successfully create new FutureBureau in bc, response: %s', method, user.toString());
      return Response(true, JSON.stringify(user));
    } catch (e) {
      logger.error('%s - Error: %s, stack: %O', method, e.message, e.stack);
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
      let sReq;
      try {
        sReq = JSON.parse(params[0]);
      } catch (e) {
        return Response(false, 'Can not parse request params[0] to a settleRequest Object');
      }
      User.CHECK_SETTLE_OPTIONS(sReq);
      const user = FutureBureau.settle(stub, sReq);
      return Response(true, JSON.stringify(user));
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = UserHandler;
