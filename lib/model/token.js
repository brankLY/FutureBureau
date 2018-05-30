const util = require('util');
const TypeChecker = require('../utils/typechecker');

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
   */
  async exist(options) {

  }

  /**
   * @typedef {Object} CreateTokenOption
   * @property {string} name - Required. The name of the token.
   * @property {string} symbol - Required. The symbol of the token.
   * @property {integer} decimals - Required. unsigned int, value should be 0-16
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
    Token.checkCreateOptions(options);
    await this.exist(options);

    this.name = options.name;
    this.symbol = options.symbol;
    this.decimals = options.decimals;

    this.owner = identity.id;

  }

  /**
   * Check if the options is a valid {@link CreateTokenOption} object
   *
   * @param {CreateTokenOption} options
   * @throws Error if some check failed.
   */
  static checkCreateOptions(options) {
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
