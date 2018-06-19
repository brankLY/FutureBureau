const util = require('util');
const TypeChecker = require('../utils/TypeChecker');
const Response = require('../utils/Response');
const {TOKEN_PREFIX} = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('Token');

const IdentityService = require('../acl/IdentityService');

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

  /**
   * Check if a type of token exists.
   *
   * @param {CreateTokenOptions} options
   * @return {Promise<boolean>}
   *   - true: the token with current name and symbol already exists
   *   - false: the token is not exist, so we can create new token with this name and symbol
   */
  static async Exists(options) {
    const {name, symbol} = options;
    // TODO: perform complex query, name and symbol both should be global unique
    return false;
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
    const exists = await this.Exists(options);
    if (exists) {
      return Response(
        false,
        util.format('Token with name %s and symbol %s already exists', options.name, options.symbol),
      );
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
    token.addHistory(id, id, options.amount, stub.getTxTimestamp());
    return token;
  }

  static async Save(stub, token) {
    const method = 'static:Save';
    try {
      const key = this.BUILD_TOKEN_KEY(stub, token.name, token.symbol);
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

  static BUILD_TOKEN_KEY(stub, name, symbol) {
    return stub.createCompositeKey(TOKEN_PREFIX, [name, symbol]);
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
