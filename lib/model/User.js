const Wallet = require('./wallet');
const util = require('util');
const IdentityService = require('../acl/IdentityService');
const TypeChecker = require('../utils/TypeChecker');
const {
  USER_PREFIX,
} = require('../utils/Constants');
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
    return this;
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
    if (!this.canCreateNewToken) {
      throw new Error('Current user are not allowed to create new Token');
    }
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

  static async Get(stub, userId) {
    const method = 'Get';
    logger.enter(method);
    let id = userId;
    if (!id) {
      const identityService = new IdentityService(stub);
      id = identityService.getName();
    }

    logger.debug('%s - get User %s', method, id);

    const key = User.BUILD_USER_KEY(stub, id);
    let user = (await stub.getState(key)).toString('utf8');
    if (!user) {
      logger.error('%s - Can not find User %s', method, id);
      throw new Error(util.format('User %s does not exist', id));
    }
    user = JSON.parse(user);
    logger.debug('%s - Successfully get user from bc. %j', method, user);

    logger.exit(method);
    return User.FROM_JSON(stub, user);
  }

  static async Exists(stub, id) {
    const method = 'static:Exists';
    logger.enter(method);
    logger.debug('%s - Check if User %s exists', method, id);
    const key = User.BUILD_USER_KEY(stub, id);
    const u = (await stub.getState(key)).toString('utf8');
    logger.debug('%s - Result: %s', method, !!u);
    logger.exit(method);
    return !!u;
  }

  /**
   * 1. check if current identity is admin user
   * 2. check if @param<newVal> is valid, id and wallet is not allowed to update
   * 3. check if user with @param<id> exist
   * 4. update the user
   * 5. save and return updated user
   * @param stub
   * @param id
   * @param newVal
   * @return {Promise<void>}
   * @constructor
   */
  static async Update(stub, id, newVal) {
    const method = 'static:Update';
    logger.enter(method);
    const currentUser = await User.Get(stub);
    // if (currentUser.role !== 'admin') {
    //   throw new Error(util.format('Only admin can update user info, current user is "%s"', currentUser.role));
    // }

    User.CHECK_UPDATE_OPTIONS(newVal);
    logger.debug('%s - Pass Update Options Check', method);

    const user = await User.Get(stub, id);
    if (!user) {
      throw new Error(util.format('Can not find user with id %s', id));
    }
    if (newVal.name) {
      user.name = newVal.name;
    }
    if (typeof newVal.canCreateNewToken === 'boolean') {
      user.canCreateNewToken = newVal.canCreateNewToken;
    }
    if (newVal.role) {
      user.role = newVal.role;
    }
    logger.debug('update user %s to new value %s', user.name, user.toString());
    logger.exit(method);
    return user.save();
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
   * @param {boolean} init If this is init call
   */
  static async Create(stub, options, init) {
    const method = 'static:Create';
    logger.enter(method);

    User.CHECK_CREATE_OPTIONS(options);
    logger.debug('%s - Pass CREATE Validation', method);

    if (!init) {
      // if not init, we need to check the current identity,
      // only the identity with CommonName same as the userId can create this user
      const identityService = new IdentityService(stub);
      const id = identityService.getName();
      logger.debug('%s - id from certificate is: %s, options.id: %s', method, id, options.id);
      if (id !== options.id) {
        throw new Error(util.format('Identity %s do not have permission to create new User %s', id, options.id));
      }
    }
    const exists = await this.Exists(stub, options.id);
    logger.debug('%s - User %s exists: %s', method, options.id, exists);

    if (exists) {
      logger.error('%s - User %s already exists', method, options.id);
      throw new Error(util.format('User %s already exists', options.id));
    }

    const user = {
      id: options.id,
      name: options.name,
      role: options.role,
      canCreateNewToken: false,
      wallet: [],
    };
    return this.Save(stub, user);
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

  static CHECK_UPDATE_OPTIONS(options) {
    if (options.id) {
      throw new Error('User id is not allowed to update');
    }
    if (options.wallet) {
      throw new Error('User wallet is not allowed to update');
    }
    if (options.name && !TypeChecker.checkString(options.name)) {
      throw new Error('Property name should be a valid string');
    }
    if (typeof options.canCreateNewToken === 'boolean' && !TypeChecker.checkBoolean(options.canCreateNewToken)) {
      throw new Error('Property canCreateNewToken should be a valid boolean value');
    }
    if (options.role && !TypeChecker.checkUserRole(options.role)) {
      throw new Error('Property role should be \'user\' or \'admin\'');
    }
  }
}

module.exports = User;
