const Wallet = require('./wallet');
const util = require('util');
const IdentityService = require('../acl/IdentityService');
const TypeChecker = require('../utils/TypeChecker');
const { USER_PREFIX } = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('User');

/**
 * @typedef {Object} User
 * @property {string} id - The id of the user.
 * @property {string} name - The name of the token.
 * @property {string} role - The role for this user.
 * @property {boolean} canCreateNewToken - If this user can create new token
 * @property {Wallet[]} wallet - The wallet for this user.
 */

/**
 * A Blockchain User
 */
class User {
  constructor(stub) {
    const method = 'constructor';
    logger.enter(method);
    if (!stub) {
      logger.error('%s - Missing Required Argument stub', method);
      throw new Error('Missing Required Argument stub');
    }
    this.stub = stub;
    logger.exit(method);
  }

  async save() {
    User.CHECK_SAVE_OPTIONS(this);
    const key = User.BUILD_USER_KEY(this.stub, this.id);
    await this.stub.putState(key, this.toBuffer());
  }

  toString() {
    const serializedUser = {
      id: this.id,
      name: this.name,
      role: this.role,
      canCreateNewToken: this.canCreateNewToken,
    };
    serializedUser.wallet = this.wallet.map(w => w.toString());
    return JSON.stringify(serializedUser);
  }

  toBuffer() {
    return Buffer.from(this.toString());
  }

  async createNewToken() {
    const method = 'createNewToken';
    logger.enter(method);
    logger.exit(method);
  }

  async transfer() {
    const method = 'transfer';
    logger.enter(method);
    // 1. validation if the transfer arguments is valid
    // 2. check if target user exists
    // 3. transfer, if target user don't have the token, create a new record for target
    // 4. update history log for current user
    // 5. update history log for target user
    // 6. save and return
    logger.exit(method);
  }

  /**
   * Return a User Object from json
   * @param stub
   * @param obj
   * @constructor
   * @return {User} user instance
   */
  static FROM_JSON(stub, obj) {
    const user = new User(stub);
    user.id = obj.id;
    user.name = obj.name;
    user.role = obj.role;
    if (!obj.wallet) {
      user.wallet = [];
    } else {
      user.wallet = obj.wallet.map(w => Wallet.fromJSON(w));
    }
    user.canCreateNewToken = obj.canCreateNewToken;
    return user;
  }

  static async Get(stub) {
    const method = 'Get';
    logger.enter(method);
    const identityService = new IdentityService(stub);
    const id = identityService.getName();
    logger.debug('%s - get User %s', method, id);

    const key = User.BUILD_USER_KEY(stub, id);
    let user = await stub.getState(key);
    if (!user) {
      logger.error('%s - Can not find User %s', method, id);
      throw new Error(util.format('User %s does not exist', id));
    }
    user = user.toString('utf8');
    user = JSON.parse(user);
    logger.debug('%s - Success. user is %j', method, user);

    logger.exit(method);
    return User.FROM_JSON(stub, user);
  }

  static async Exists(stub, id) {
    const key = User.BUILD_USER_KEY(stub, id);
    const u = await stub.getState(key);
    return !!u;
  }

  static async Update(stub, id, newVal) {
    const method = 'static:Update';
    logger.enter(method);
    // 1. check if current identity is admin user
    // 2. check if @param<newVal> is valid, id is not allowed to update
    // 3. check if user with @param<id> exist
    // 4. update the user
    // 5. save and return
    logger.exit(method);
  }

  /**
   * @typedef {Object} CreateUserOption
   * @property {string} id - Required. The id of the user.
   * @property {string} name - Required. The name of the token.
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
    const method = 'static:Create';
    logger.enter(method);

    User.CHECK_CREATE_OPTIONS(options);
    logger.debug('%s - Pass CREATE Validation', method);

    const identityService = new IdentityService(stub);
    const id = identityService.getName();
    logger.debug('%s - id from certificate is: %s, options.id: %s', method, id, options.id);
    if (id !== options.id) {
      throw new Error(util.format('Identity %s do not have permission to create new User %s', id, options.id));
    }

    const user = {
      id: options.id,
      name: options.name,
      role: options.role,
      canCreateNewToken: false,
      wallet: [],
    };
    await this.Save(stub, user);
  }

  static async Save(stub, userObj) {
    User.CHECK_SAVE_OPTIONS(userObj);
    const user = User.FROM_JSON(stub, userObj);
    return user.save();
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
    if (!options.role) {
      throw new Error(util.format('%j is not a valid CreateUserOption Object, Missing Required property %s', options, 'role'));
    }
    if (!TypeChecker.checkString(options.id)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.id', options.id));
    }
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.name', options.name));
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
    if (!options.wallet) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'wallet'));
    }
    if (!TypeChecker.checkString(options.id)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.id', options.id));
    }
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.name', options.name));
    }
    if (!TypeChecker.checkBoolean(options.canCreateNewToken)) {
      throw new Error(util.format('%j is not a valid Boolean for CreateUserOption.canCreateNewToken', options.canCreateNewToken));
    }
    if (!TypeChecker.checkArray(options.wallet)) {
      throw new Error(util.format('%j is not a valid Array for CreateUserOption.wallet', options.wallet));
    }
  }
}

module.exports = User;
