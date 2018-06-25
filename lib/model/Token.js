const util = require('util');
const TypeChecker = require('../utils/TypeChecker');
const { TOKEN_PREFIX } = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('Token');

const IdentityService = require('../acl/IdentityService');

const math = require('mathjs');

math.config({
  number: 'BigNumber',
  precision: 18, // default precision to 18
});

class Token {
  toJSON() {
    return {
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      amount: this.amount,
      history: this.history,
    };
  }

  addHistory(from, to, amount, timestamp) {
    this.history.push({
      from,
      to,
      amount,
      timestamp,
    });
  }

  minus(amount) {
    const method = 'minus';
    try {
      logger.enter(method);
      logger.debug('%s - minus amount %s, current %s, have enough token:%s', method, amount, this.amount, amount < this.amount);

      if (amount > this.amount) {
        throw new Error('Do not have enough token');
      }
      math.config({ precision: this.decimals });
      this.amount = math.subtract(this.amount, amount);
      logger.debug('%s - After minus there are %s tokens', method, this.amount);
      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }

  add(amount) {
    const method = 'add';
    try {
      logger.enter(method);
      logger.debug('%s - add amount %s current %s', method, amount, this.amount);

      math.config({ precision: this.decimals });
      this.amount = math.add(this.amount, amount);

      logger.debug('%s - After add there are %s tokens', method, this.amount);

      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }

  /**
   * Check if a type of token exists.
   *
   * @param {CreateTokenOptions} options
   * @return {Promise<boolean>}
   *   - true: the token with current name and symbol already exists
   *   - false: the token is not exist, so we can create new token with this name and symbol
   */
  static async Exists(stub, options) {
    const method = 'static:Exists';
    // TODO: perform complex query to check if token with this symbol exists
    logger.enter(method);
    const { name } = options;
    logger.debug('%s - Check if Token %s exists', method, name);
    const key = Token.BUILD_TOKEN_KEY(stub, name);
    const token = (await stub.getState(key)).toString('utf8');
    logger.debug('%s - Result: %s', method, !!token);
    logger.exit(method);
    return !!token;
  }

  /**
   * @typedef {Object} CreateTokenOption
   * @property {string} name - Required. The name of the token.
   * @property {string} symbol - Required. The symbol of the token.
   * @property {integer} decimals - Required. unsigned int4, value should be 0-16
   * @property {integer} amount - Required. unsigned int64
   */

  /**
   * Create a new Token
   *
   * @param {Stub} stub
   * @param {CreateTokenOption} options
   * @return {Promise<Token>}
   */
  static async Create(stub, options) {
    Token.CHECK_CREATE_OPTIONS(options);
    const exists = await this.Exists(stub, options);
    if (exists) {
      throw new Error(util.format('Token with name %s already exists', options.name));
    }

    const tokenObj = {
      name: options.name,
      symbol: options.symbol,
      decimals: options.decimals,
      amount: options.amount,
    };

    await this.Save(stub, tokenObj);
    const token = this.FROM_JSON(tokenObj);
    const identityService = new IdentityService(stub);
    const id = identityService.getName();
    token.addHistory(id, id, options.amount, stub.getTxTimestamp().seconds.low * 1000);
    return token;
  }

  static async Save(stub, token) {
    const method = 'static:Save';
    try {
      const key = this.BUILD_TOKEN_KEY(stub, token.name);
      const serializedToken = JSON.stringify(token);
      await stub.putState(key, Buffer.from(serializedToken));
    } catch (e) {
      logger.error('%s - Failed to Save New Token Info, Error: %j', method, e.message);
      throw e;
    }
  }

  /**
   * Create a Token instance from Json
   * @param obj
   * @return {Token}
   * @constructor
   */
  static FROM_JSON(obj) {
    const token = new Token();
    token.name = obj.name;
    token.symbol = obj.symbol;
    token.decimals = obj.decimals;
    token.amount = obj.amount;
    token.history = obj.history || [];
    return token;
  }

  static async NEW_EMPTY_TOKEN(stub, name) {
    const method = 'NEW_EMPTY_TOKEN';
    try {
      logger.enter(method);
      const key = this.BUILD_TOKEN_KEY(stub, name);
      let tokenInfo = (await stub.getState(key)).toString('utf8');
      if (!tokenInfo) {
        throw new Error(util.format('Can not found token %s from bc', name));
      }
      tokenInfo = JSON.parse(tokenInfo);
      const token = new Token();
      token.name = tokenInfo.name;
      token.decimals = tokenInfo.decimals;
      token.symbol = tokenInfo.symbol;
      token.amount = 0;
      token.history = [];
      logger.exit(method);
      return token;
    } catch (e) {
      throw e;
    }
  }

  static BUILD_TOKEN_KEY(stub, name) {
    return stub.createCompositeKey(TOKEN_PREFIX, [name]);
  }

  /**
   * Check if the options is a valid {@link CreateTokenOption} object
   *
   * @param {CreateTokenOption} options
   * @throws Error if some check failed.
   */
  static CHECK_CREATE_OPTIONS(options) {
    if (!options.name) {
      throw new Error(util.format('%j is not a valid CreateTokenOption Object, Missing Required property %s', options, 'name'));
    }
    if (!options.symbol) {
      throw new Error(util.format('%j is not a valid CreateTokenOption Object, Missing Required property %s', options, 'symbol'));
    }
    if (!options.decimals) {
      throw new Error(util.format('%j is not a valid CreateTokenOption Object, Missing Required property %s', options, 'decimals'));
    }
    if (!options.amount) {
      throw new Error(util.format('%j is not a valid CreateTokenOption Object, Missing Required property %s', options, 'amount'));
    }
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateTokenOption.name', options.name));
    }
    if (!TypeChecker.checkString(options.symbol)) {
      throw new Error(util.format('%j is not a valid string for CreateTokenOption.symbol', options.symbol));
    }
    if (!TypeChecker.checkUint4(options.decimals)) {
      throw new Error(util.format('%j is not a valid uint4 for CreateTokenOption.decimals', options.decimals));
    }
    if (!TypeChecker.checkInteger(options.amount)) {
      throw new Error(util.format('%j is not a valid uint64 for CreateTokenOption.amount', options.amount));
    }
  }
}

module.exports = Token;
