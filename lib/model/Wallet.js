const logger = require('../utils/Logger').getLogger('Wallet');
const util = require('util');
const Token = require('./Token');

/**
 * User Wallet, Each user only has one wallet
 *
 * @property {User} owner the owner of this wallet
 * @property {Array[]} tokens the tokens in this wallet
 */
class Wallet {
  constructor(stub) {
    this.stub = stub;
    this.tokens = {};
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
    Object.entries(this.tokens).forEach(([name, token]) => {
      res[name] = token.toJSON();
    });
    return res;
  }

  /**
   * Add a new Token type
   * @param {Token} token
   */
  addNewToken(token) {
    const method = 'addNewToken';
    logger.enter(method);
    if (this.tokens[token.name]) {
      throw new Error(util.format('Token %s already exists at user\'s wallet', token.name));
    }
    this.tokens[token.name] = token;
    logger.exit(method);
  }

  async earn(tokenName, amount, opts) {
    const method = 'earn';
    try {
      logger.enter(method);
      logger.debug('%s - Earn %s amount of token %s', method, amount, tokenName);

      let token = this.tokens[tokenName];
      if (!token) {
        token = await Token.NEW_EMPTY_TOKEN(this.stub, tokenName);
        this.tokens[tokenName] = token;
      }

      token.add(amount);
      token.addHistory(opts.from, opts.to, opts.amount, this.stub.getTxTimestamp().seconds.low * 1000);

      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }

  /**
   * Expend amount value of token
   * @param token
   * @param amount
   */
  expend(tokenName, amount, opts) {
    const method = 'expend';
    try {
      logger.enter(method);
      logger.debug('%s - Expend %s amount of token %s, opts: %j', method, amount, tokenName, opts);
      const token = this.tokens[tokenName];
      if (!token) {
        throw new Error(util.format('%s - There is not enough token %s in wallet', method, tokenName));
      }
      token.minus(amount);
      token.addHistory(opts.from, opts.to, opts.amount, this.stub.getTxTimestamp().seconds.low * 1000);
      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }

  static NEW_EMPTY_WALLET(stub) {
    const method = 'static:Create';
    logger.enter(method);
    logger.exit(method);
    return new Wallet(stub);
  }

  static FROM_JSON(stub, obj) {
    const method = 'static:FROM_JSON';
    logger.enter(method);
    logger.debug('%s - Resume Wallet with %j', method, obj);
    const wallet = new Wallet(stub);
    if (Object.keys(obj).length === 0) {
      logger.debug('No tokens found, return an empty wallet');
      logger.exit(method);
      return wallet;
    }
    Object.entries(obj).forEach(([name, token]) => {
      wallet.tokens[name] = Token.FROM_JSON(token);
    });
    logger.exit(method);
    return wallet;
  }
}

module.exports = Wallet;
