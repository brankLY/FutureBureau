const util = require('util');
const TypeChecker = require('../utils/TypeChecker');
const Response = require('../utils/Response');

class Token {
  /**
   *
   */
  constructor(stub) {
    if (!stub) {
      throw new Error('Token constructor Missing Required Argument stub');
    }
    this.stub = stub;
  }

  /**
   * Check if a type of token exists.
   *
   * @param {CreateTokenOptions} options
   * @return {Promise<boolean>}
   *   - true: the token with current name and symbol already exists
   *   - false: the token is not exist, so we can create new token with this name and symbol
   */
  async exists(options) {
    Token.CHECK_CREATE_OPTIONS(options);
    const { name, symbol } = options;
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
   * @param {CreateTokenOption} options
   * @param {User} identity
   * @return {Promise<ResponseMessage>}
   */
  async create(options, identity) {
    Token.CHECK_CREATE_OPTIONS(options);
    const exists = await this.exists(options);
    if (exists) {
      return Response(
        false,
        util.format('Token with name %s and symbol %s already exists', options.name, options.symbol),
      );
    }

    this.name = options.name;
    this.symbol = options.symbol;
    this.decimals = options.decimals;

    this.owner = identity.id;
    return Response(true, 'ok');
  }

  static BUILD_TOKEN_KEY(name, symbol) {
    return name+symbol;
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
