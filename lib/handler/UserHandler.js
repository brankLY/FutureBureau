const util = require('util');
const User = require('../model/User');
const FutureBureau = require('../model/FutureBureau');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
const math = require('mathjs');

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
      
      logger.debug('%s - Create new User with options %j', method, opts);
      let account = await stub.invokeChaincode('earth', ['user.create', params[0], params[1]]);
      logger.debug('- Create new account with options %s', account.toBuffer());
      account = account.toBuffer();
      const opts = {
        id: account.id,
        name: account.name,
        role: 'user',
      };
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
      user = await user.betTransfer(BETTokenTransferRequest);

      logger.debug('%s - Successfully transferred bet Token in bc, response: %s', method, user.toString());
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
      // const account = await stub.invokeChaincode('earth', ['user.transfer',params[0]]);
      // logger.debug('- invokeChaincode Options:%j', account);
      logger.debug('%s - Successfully transferred Token in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
  static async transferBack(i, user, len, futureBureau, rate, result, flag) {
    const transferTokenRequest = {
      target: futureBureau.history[i].from,
      tokenName: futureBureau.history[i].tokenName,
      amount: math.multiply(futureBureau.history[i].amount, rate),
    };
    logger.debug('transferTokenRequest is %j', transferTokenRequest);
    logger.debug('transferTokenRequest amount is %j', transferTokenRequest.amount);
    logger.debug('transferTokenRequest target is %j', transferTokenRequest.target);
    logger.debug('settleRequest.result is %j', result);
    logger.debug('futureBureau.history.chooseOption is %j', futureBureau.history[i].chooseOption);
    logger.debug('------show flag---------- %d', flag[i]);
    if (result === futureBureau.history[i].chooseOption && flag[i] === 0) {
      for (let j = math.add(i, 1); j < len; j = math.add(j, 1)) {
        if (transferTokenRequest.target === futureBureau.history[j].from) {
          logger.debug('------show futureBureau.history[j].from---------- %s', futureBureau.history[j].from);
          logger.debug('------show futureBureau.history[j].amount---------- %d', futureBureau.history[j].amount);
          if (result === futureBureau.history[j].chooseOption) {
            transferTokenRequest.amount = math.add(transferTokenRequest.amount, math.multiply(futureBureau.history[j].amount, rate));
            logger.debug('------show amount in---------- %d', transferTokenRequest.amount);
          }
          logger.debug('------show amount out---------- %d', transferTokenRequest.amount);
          flag.splice(j, 1, 1);
          logger.debug('------show inline flag---------- %d', flag[j]);
        }
      }
      await user.transfer(transferTokenRequest);
      logger.debug('count', i);
    }
    let k = i;
    k = math.add(k, 1);
    logger.debug('outcount is %s', k);
    if (k < len) {
      setTimeout(() => {
      }, 5000);
      await this.transferBack(k, user, len, futureBureau, rate, result, flag);
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
      let user = await User.Get(stub);
      user = await user.judge(stub, settleRequest);
      let futureBureau = await FutureBureau.Get(stub, settleRequest);
      if (futureBureau.result !== 'Undecided') {
        logger.error('FutureBureau %s already judeged', futureBureau.name);
        throw new Error(util.format('FutureBureau %s already judeged', futureBureau.name));
      }
      logger.debug('%s 77777', futureBureau.count1);
      futureBureau = FutureBureau.FROM_JSON(futureBureau);
      logger.debug('%s 88888', futureBureau.count1);
      let count;
      logger.debug('result is %s', settleRequest.result);
      switch (settleRequest.result) {
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
      await this.transferBack(i, user, len, futureBureau, rate, settleRequest.result, flag);
      logger.debug('%s - Successfully settled in bc, response: %s', method, user.toString());
      return Response(true, user.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = UserHandler;
