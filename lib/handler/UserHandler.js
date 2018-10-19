const util = require('util');
const User = require('../model/User');
const FutureBureau = require('../model/FutureBureau');
const Bureau = require('../model/Bureau');
const math = require('mathjs');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
const SchemaCheker = require('../utils/SchemaChecker');
const {
  EARTH_CHAINCODE_ID,
} = require('../utils/Constants');

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

      const schema = [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'role', type: 'string', required: false },
      ];
      SchemaCheker.check(schema, createRequest);
      logger.debug('%s - Create new User with options %j', method, createRequest);
      await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['account.create', JSON.stringify(createRequest)]);
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
      const checkTime = this.checkTime(futureBureau);
      logger.debug('%s - FutureBureau valid: %s', method, checkTime);
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
        description: 'betTransfer to contract account',
      };
      const targetBureau = await FutureBureau.Get(stub, BETTokenTransferRequest);
      if (targetBureau.result !== 'Undecided') {
        logger.error('FutureBureau %s already judeged', targetBureau.name);
        throw new Error(util.format('FutureBureau %s already judeged', targetBureau.name));
      }

      logger.debug('%s - Bet Options:%j', method, BETTokenTransferRequest);
      User.CHECK_BETTRANSFER_OPTIONS(BETTokenTransferRequest);
      let user = await User.Get(stub);
      user = User.FROM_JSON(stub, user);
      user = await user.betTransfer(BETTokenTransferRequest);
      await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['wallet.transfer', JSON.stringify(transferTokenRequest)]);
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

      logger.debug('%s - Settle Options:%j', method, sReq);
      User.CHECK_SETTLE_OPTIONS(sReq);
      let user = await User.Get(stub);
      user = User.FROM_JSON(stub, user);
      let futureBureau = await FutureBureau.Get(stub, sReq);
      futureBureau = FutureBureau.FROM_JSON(futureBureau);
      if (futureBureau.result !== 'Undecided') {
        logger.error('FutureBureau %s already judeged', futureBureau.name);
        throw new Error(util.format('FutureBureau %s already judeged', futureBureau.name));
      }
      user = await User.judge(stub, sReq);
      logger.debug('%s 77777', futureBureau.count1);
      logger.debug('%s 88888', futureBureau.count1);
      let count;
      logger.debug('result is %s', sReq.result);
      switch (sReq.result) {
        case 'option1':
          count = futureBureau.count1;
          logger.debug('%s 99998888', futureBureau.count1);
          break;
        case 'option2':
          count = futureBureau.count2;
          logger.debug('%s 99998888', futureBureau.count2);
          break;
        case 'option3':
          count = futureBureau.count3;
          logger.debug('%s 99998888', futureBureau.count3);
          break;
        case 'option4':
          count = futureBureau.count4;
          logger.debug('%s 99998888', futureBureau.count4);
          break;
        case 'option5':
          count = futureBureau.count5;
          logger.debug('%s 99998888', futureBureau.count5);
          break;
        default:
          logger.debug('%s 7778888', futureBureau);
          break;
      }
      logger.debug('count is %s settleRequest.result', count);
      let rate = math.add(futureBureau.count1, futureBureau.count2);
      logger.debug('%s 99998888 %s', futureBureau.count2, rate);
      rate = math.add(rate, futureBureau.count3);
      rate = math.add(rate, futureBureau.count4);
      rate = math.add(rate, futureBureau.count5);
      logger.debug('%s 66668888 %s', count, rate);
      if (count === 0) {
        rate = 0;
      } else {
        rate = math.divide(rate, count);
      }
      logger.debug('rate is %s ', rate);
      user = await User.Get(stub);
      let len = 0;
      futureBureau.history.forEach(() => {
        len = math.add(len, 1);
      });
      let i = 0;
      i = 0;
      logger.debug('transferTokenRequest user is %s', user.id);
      logger.debug('history is %j', futureBureau.history);
      logger.debug('history length is %s', len);
      logger.debug('history length is %s', futureBureau.history.length);
      logger.debug('history length is %s', futureBureau.history.length[0]);
      logger.debug('futureBureau length is %j', futureBureau.toJSON().length);
      logger.debug('futureBureau history length is %j', futureBureau.toJSON().history.length);
      logger.debug('first history`s amount is %s', futureBureau.history[0].amount);
      logger.debug('rate is %s ', rate);
      let flag = [];
      for (let k = 0; k < len; k = math.add(k, 1)) {
        flag.push(0);
      }
      let token = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['token.getInfo', 'GZH']);
      logger.debug('%s - Successfully get token', method, token.payload.toString('utf8'));
      token = token.payload.toString('utf8');
      token = JSON.parse(token);
      await Bureau.transferBack(stub, i, user, len, futureBureau, rate, sReq.result, flag, token.gasPercentage, token.gasMin);
      user = await User.Get(stub);
      logger.debug('%s - Successfully settled in bc, response: %s', method, user.toString());
      return Response(true, JSON.stringify(user));
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  // async setDeadLine(option) {
  //   const ts = this.stub.getTxTimestamp();
  //   const stepTime = 86400000;
  //   let timestamp = ts.seconds.toInt();
  //   const nanos = ts.nanos / 1000000;
  //   // eslint-disable-next-line no-mixed-operators
  //   timestamp = 86400000 * option + timestamp;
  //   timestamp = timestamp * 1000 + nanos;

  //   return new Date(timestamp);
  // }


  // params[0]: userId
  // params[1]: newValue json string
  static async checkTime(options) {
    const method = 'checkTime';
    try {
      logger.enter(method);
      const endTime = new Date(options.endTime);
      const now = Date.now();
      logger.debug('%s - endTime is  %s, now is %s', method, endTime, now);
      if (endTime <= now) {
        logger.error('FutureBureau %s already end', options.name);
        throw new Error(util.format('FutureBureau %s already end', options.name));
      }
      logger.exit(method);
      return true;
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}


module.exports = UserHandler;
