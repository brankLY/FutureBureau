const logger = require('../utils/Logger').getLogger('Bureau');
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
      logger.debug('%j - Expend  amount of token ', res[name]);
      logger.debug('%j - +++++++++Expend  amount of token ', futureBureau);
      res[name] = futureBureau.toJSON(futureBureau);
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
}

module.exports = Bureau;
