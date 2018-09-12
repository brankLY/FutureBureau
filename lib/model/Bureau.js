const logger = require('../utils/Logger').getLogger('Bureau');
const FutureBureau = require('./FutureBureau');
const math = require('mathjs');
const {
  EARTH_CHAINCODE_ID,
} = require('../utils/Constants');

/**
 * User Bureau, Each user only has one bureau
 *
 * @property {User} owner the owner of this bureau
 * @property {Array[]} futurebureaus the futurebureaus in this bureau
 */
class Bureau {
  constructor(stub) {
    this.stub = stub;
    this.futureBureaus = {};
  }

  // toString() {
  //   const res = {};
  //   Object.entries(this.tokens).forEach(([name, token]) => {
  //     res[name] = token.toString();
  //   });
  //   return JSON.stringify(res);
  // }
  toJSON() {
    const res = {};
    Object.entries(this.futureBureaus).forEach(([name, futureBureau]) => {
      logger.debug('%j - Expend  amount of token ', res[name]);
      logger.debug('%j - +++++++++Expend  amount of token ', futureBureau);
      res[name] = futureBureau.toJSON();
      logger.debug('%j - ---------++++++Expend  amount of token ', res[name]);
    });
    return res;
  }

  /**
   * Add a new FutureBureau type
   * @param {FutureBureau} futureBureau
   */
  async addNewFutureBureau(targetBureau) {
    const method = 'addNewFutureBureau';
    logger.enter(method);
    this.futureBureaus[targetBureau.name] = targetBureau;
    logger.debug('%s is %j', targetBureau.name, targetBureau.toJSON());
    logger.exit(method);
  }

  async addFutureBureauHistory(stub, name, history) {
    const method = 'addFutureBureauHistory';
    logger.enter(method);
    if (!this.futureBureaus[name]) {
      logger.debug('first bettransfer %s', name);
      this.futureBureaus[name] = await FutureBureau.NEW_EMPTY_FUTUREBUREAU(stub, name);
    }
    this.futureBureaus[name].history.push(history);
    logger.exit(method);
  }
  /**
   * Add a new FutureBureau type
   * @param {FutureBureau} token
   */

  static NEW_EMPTY_BUREAU(stub) {
    const method = 'static:Create';
    logger.enter(method);
    logger.exit(method);
    return new Bureau(stub);
  }

  static FROM_JSON(stub, obj) {
    const method = 'static:FROM_JSON';
    logger.enter(method);
    logger.debug('%s - Resume Bureau with %j', method, obj);
    const bureau = new Bureau(stub);
    if (Object.keys(obj).length === 0) {
      logger.debug('No futureBureaus found, return an empty bureau');
      logger.exit(method);
      return bureau;
    }
    Object.entries(obj).forEach(([name, futureBureau]) => {
      bureau.futureBureaus[name] = FutureBureau.FROM_JSON(futureBureau);
    });
    logger.exit(method);
    return bureau;
  }

  static async transferBack(stub, i, user, len, futureBureau, rate, result, flag, gasPercentage, gasMin) {
    const contractAccountId = (await stub.getState('Dapp_futurebureau')).toString('utf8');
    let request = {
      symbol: 'GZH',
      from: contractAccountId,
      target: futureBureau.history[i].from,
      amount: math.multiply(futureBureau.history[i].amount, rate),
      description: 'futurebureau transferBack',
    };
    let gas = 0;
    logger.debug('transferTokenRequest is %j', request);
    logger.debug('gasPercentage is %s', gasPercentage);
    logger.debug('gasMin is %s', gasMin);
    logger.debug('transferTokenRequest amount is %j', request.amount);
    logger.debug('transferTokenRequest target is %j', request.target);
    logger.debug('settleRequest.result is %j', result);
    logger.debug('futureBureau.history.chooseOption is %j', futureBureau.history[i].chooseOption);
    logger.debug('------show flag---------- %d', flag[i]);
    if (result === futureBureau.history[i].chooseOption && flag[i] === 0 && (request.amount > gasMin)) {
      for (let j = math.add(i, 1); j < len; j = math.add(j, 1)) {
        if (request.target === futureBureau.history[j].from) {
          logger.debug('------show futureBureau.history[j].from---------- %s', futureBureau.history[j].from);
          logger.debug('------show futureBureau.history[j].amount---------- %d', futureBureau.history[j].amount);
          if (result === futureBureau.history[j].chooseOption) {
            request.amount = math.add(request.amount, math.multiply(futureBureau.history[j].amount, rate));
            logger.debug('------show amount in---------- %d', request.amount);
          }
          logger.debug('------show amount out---------- %d', request.amount);
          flag.splice(j, 1, 1);
          logger.debug('------show inline flag---------- %d', flag[j]);
        }
      }
      // request.amount = String(request.amount);
      gas = math.multiply(request.amount, gasPercentage);
      request.amount = math.subtract(request.amount, gas);
      request.amount = Number(request.amount.toFixed(8));
      request = JSON.stringify(request);
      logger.debug('%s------show inline request---------- ', request);
      await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['wallet.transfer', request]);
      logger.debug('count', i);
    }
    let k = i;
    k = math.add(k, 1);
    logger.debug('outcount is %s', k);
    if (k < len) {
      setTimeout(() => {
      }, 5000);
      await this.transferBack(stub, k, user, len, futureBureau, rate, result, flag, gasPercentage, gasMin);
    }
  }
}

module.exports = Bureau;
