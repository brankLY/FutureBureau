const Wallet = require('./wallet');
const util = require('util');
const IdentityService = require('../acl/IdentityService');
const TypeChecker = require('../utils/TypeChecker');
const { USER_PREFIX } = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('User');

class User {
  constructor(stub) {
    const method = 'constructor';
    logger.enter(method);
    this.stub = stub;
    logger.exit(method);
  }

  static async Exists(stub, id) {
    const key = User.BUILD_USER_KEY(stub, id);
    const u = await stub.getState(key);
    return !!u;
  }

  /**
   * @typedef {Object} CreateUserOption
   * @property {string} id - Required. The id of the user.
   * @property {string} name - Required. The name of the token.
   * @property {string} org - Required. The org this user belongs to.
   * @property {string} role - Required. The role for this user.
   * @property {Wallet[]} wallet - Optional. The wallet for this user.
   */

  /**
   * Create a new User
   *
   * @param {ChaincodeStub} stub Node shim chaincode stub
   * @param {CreateUserOption} options
   */
  static async Create(stub, options) {
    User.CHECK_CREATE_OPTIONS(options);
    // const identityService = new IdentityService(stub);
    // const id = identityService.getName();
    // if (id !== options.id) {
    //   throw new Error(util.format('Identity %s do not have permission to create new User %s', id, options.id));
    // }
    const user = {
      id: options.id,
      name: options.name,
      org: options.org,
      role: options.role,
      canCreateNewToken: false,
      wallets: [],
    };
    await this.Save(stub, user);
  }

  static async Resume() {
    const identityService = new IdentityService(this.stub);
    const id = identityService.getName();
    await this.stub.getState(id);
  }

  static async Save(stub, user) {
    User.CHECK_SAVE_OPTIONS(user);
    const serializedUser = Object.assign({}, user);
    serializedUser.wallets = user.wallets.map(w => w.toString());
    const key = User.BUILD_USER_KEY(stub, user.id);
    await stub.putState(key, Buffer.from(JSON.stringify(serializedUser)));
  }

  static BUILD_USER_KEY(stub, id) {
    return stub.createCompositeKey(USER_PREFIX, [id]);
  }

  /**
   * Check if the options is a valid {@link CreateUserOption} object
   *
   * @param {CreateUserOption} options
   * @throws Error if some check failed.
   */
  static CHECK_CREATE_OPTIONS(options) {
    if (!options || typeof options !== 'object') {
      throw new Error(util.format('Missing Required param options or options is not a valid object'));
    }
    if (!options.id) {
      throw new Error(util.format('%j is not a valid CreateUserOption Object, Missing Required property %s', options, 'id'));
    }
    if (!options.name) {
      throw new Error(util.format('%j is not a valid CreateUserOption Object, Missing Required property %s', options, 'name'));
    }
    if (!options.org) {
      throw new Error(util.format('%j is not a valid CreateUserOption Object, Missing Required property %s', options, 'org'));
    }
    if (!options.role) {
      throw new Error(util.format('%j is not a valid CreateUserOption Object, Missing Required property %s', options, 'role'));
    }
    if (!TypeChecker.checkString(options.id)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.id', options.id));
    }
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.name', options.name));
    }
    if (!TypeChecker.checkString(options.org)) {
      throw new Error(util.format('%j is not a valid uint4 for CreateUserOption.org', options.org));
    }
    if (!TypeChecker.checkString(options.role)) {
      throw new Error(util.format('%j is not a valid uint64 for CreateUserOption.role', options.role));
    }
  }

  static CHECK_SAVE_OPTIONS(options) {
    const method = 'User.save(stub, user)';
    if (!options || typeof options !== 'object') {
      throw new Error(util.format('%s - Missing Required param "user" or "user" is not of type "object"', method));
    }
    if (!options.id) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'id'));
    }
    if (!options.name) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'name'));
    }
    if (!options.role) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'role'));
    }
    if (options.canCreateNewToken === undefined) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'canCreateNewToken'));
    }
    if (!options.wallets) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'wallets'));
    }
    if (!TypeChecker.checkString(options.id)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.id', options.id));
    }
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.name', options.name));
    }
    if (!TypeChecker.checkBoolean(options.canCreateNewToken)) {
      throw new Error(util.format('%j is not a valid uint4 for CreateUserOption.org', options.canCreateNewToken));
    }
    if (!TypeChecker.checkArray(options.wallets)) {
      throw new Error(util.format('%j is not a valid uint64 for CreateUserOption.role', options.wallets));
    }
  }
}

module.exports = User;
