const logger = require('../utils/Logger').getLogger('Wallet');
const util = require('util');
const FutureBureau = require('./FutureBureau');

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
      res[name] = futureBureau.toJSON();
    });
    return res;
  }

  /**
   * Add a new FutureBureau type
   * @param {FutureBureau} token
   */
  addNewFutureBureau(futureBureau) {
    const method = 'addNewFutureBureau';
    logger.enter(method);
    if (this.futureBureaus[futureBureau.name]) {
      throw new Error(util.format('FutureBureau %s already exists at user\'s bureau', futureBureau.name));
    }
    this.futureBureaus[futureBureau.name] = futureBureau;
    logger.exit(method);
  }

  /**
   * Add a new FutureBureau type
   * @param {FutureBureau} token
   */
  async recordBet(futureBureauName, opts) {
    const method = 'recordBet';
    try {
      logger.enter(method);
      logger.debug('%s - Expend %s amount of token %s, opts: %j', method, opts.amount, opts.tokenName, opts);
      const futureBureau = this.futurebureaus[futureBureauName];
      if (!futureBureau) {
        throw new Error(util.format('%s - There is not enough futureBureau %s in wallet', method, opts.tokenName));
      }
      futureBureau.addHistory(opts.from, opts.to, opts.tokenName, opts.chooseOption, opts.amount, this.stub.getTxTimestamp().seconds.low * 1000);
      switch(opts.chooseOption){
        case 'option1':
           futureBureau.count1+opts.amount;
        case 'option2':
           futureBureau.count2+opts.amount;
        case 'option3':
           futureBureau.count3+opts.amount;
        case 'option4':
           futureBureau.count4+opts.amount;
        case 'option5':
           futureBureau.count5+opts.amount;
      }
      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }

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
}

module.exports = Bureau;
