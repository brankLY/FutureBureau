const Bureau = require('./Bureau');
const FutureBureau = require('./FutureBureau');
const util = require('util');
const IdentityService = require('../acl/IdentityService');
const TypeChecker = require('../utils/TypeChecker');
const {
  USER_PREFIX,
} = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('User');
// const { StringDecoder } = require('string_decoder');
/**
 * @typedef {Object} User
 * @property {string} id - The id of the user.
 * @property {string} name - The name of the token.
 * @property {string} role - The role for this user.
 *roperty {boolean} canCreateNewToken - If this user can create new token
 * @property {Wallet} wallet - The wallet for this user.
  * @property {Bureau} bureau - The bureau for this user.
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
    const method = 'save';
    try {
      logger.enter(method);
      User.CHECK_SAVE_OPTIONS(this);
      logger.debug('Pass Save Options Check');
      logger.debug('%s - Result user Check in save %j', method, this);
      const key = User.BUILD_USER_KEY(this.stub, this.id);
      await this.stub.putState(key, this.toBuffer());
      logger.exit(method);
      return this;
    } catch (e) {
      throw e;
    }
  }

  toJSON() {
    const obj = {
      id: this.id,
      name: this.name,
      role: this.role,
      canCreateNewToken: this.canCreateNewToken,
      canCreateNewFutureBureau: this.canCreateNewFutureBureau,
    };
    obj.bureau = this.bureau.toJSON();
    return obj;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toBuffer() {
    return Buffer.from(this.toString());
  }

  async createNewFutureBureau(opts) {
    const method = 'createNewFutureBureau';
    logger.enter(method);
    if (!this.canCreateNewFutureBureau) {
      throw new Error('Current user are not allowed to create new FutureBureau');
    }
    const createFutureBureauOptions = Object.assign({}, opts);
    User.CHECK_CREATE_FUTUREBUREAU_OPTIONS(createFutureBureauOptions);
    try {
      const futureBureau = await FutureBureau.Create(this.stub, createFutureBureauOptions);
      this.bureau.addNewFutureBureau(futureBureau);
      this.canCreateNewFutureBureau = false;
      logger.exit(method);
      return this.save();
    } catch (e) {
      logger.error('%s - Failed to create new FutureBureau, Error: %s', method, e.message);
      throw e;
    }
  }
  /**
   * Transfer token of amount to target
   *
   * @param {string} target target user id
   * @param {string} tokenName the symbol of the token
   * @param {number} amount the amount of token to transfer
   * @return {Promise<void>}
   */
  async betTransfer(opts) {
    const method = 'betTransfer';
    try {
      logger.enter(method);
      logger.debug('%s - betTransfer opts %j', method, opts);
      // const { target: targetId, tokenName } = opts;
      // check if target user exists
      let targetBureau = await FutureBureau.Get(this.stub, opts);
      targetBureau = FutureBureau.FROM_JSON(targetBureau);
      logger.debug('%s - betTransfer to target %s', method, opts.target);
      // betTransfer, if target user don't have the token, create a new record for target
      const history = {
        from: this.id,
        to: opts.target,
        tokenName: opts.tokenName,
        chooseOption: opts.chooseOption,
        amount: opts.amount,
        timestamp: this.stub.getTxTimestamp().seconds.low * 1000,
      };
      await FutureBureau.recordBet(this.stub, targetBureau, history);
      this.bureau.addNewFutureBureau(targetBureau);
      logger.debug('+++++++rrrr++++++++++ %j', targetBureau);
      // save and return
      logger.debug('Save Target user');
      logger.exit(method);
      return this.save();
    } catch (e) {
      logger.error('%s - Error: %s', e.message);
      throw e;
    }
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
    user.canCreateNewFutureBureau = obj.canCreateNewFutureBureau;
    if (obj.bureau === undefined) {
      user.bureau = Bureau.NEW_EMPTY_BUREAU(stub);
    } else {
      user.bureau = Bureau.FROM_JSON(stub, obj.bureau);
    }
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
    logger.debug('%s - get key %s', method, key);
    let user = (await stub.getState(key)).toString('utf8');
    let account = await stub.invokeChaincode('earth', ['user.query']);
    account = account.payload.toString('utf8');
    logger.debug('- toString(account) in user %s', account);
    account = JSON.parse(account);
    logger.debug('%j - JSON.parse in user %s', account, account);
    if (!user) {
      logger.error('%s - Can not find User %s', method, id);
      throw new Error(util.format('User %s does not exist', id));
    }
    user = JSON.parse(user);
    logger.debug('%s - Successfully get user from bc. %j', method, user);
    logger.exit(method);
    return User.MIX_USER(stub, user, account);
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


  static async UpdateBureau(stub, id, newVal) {
    const method = 'static:UpdateBureau';
    logger.enter(method);
    const currentUser = await User.Get(stub);
    if (currentUser.role !== 'admin') {
      throw new Error(util.format('Only admin can update bureau info, current user is "%s"', currentUser.role));
    }

    User.CHECK_UPDATE_BUREAU_OPTIONS(newVal);
    logger.debug('%s - Pass Update Options Check', method);

    let user = await User.Get(stub, id);
    if (!user) {
      throw new Error(util.format('Can not find user with id %s', id));
    }
    if (typeof newVal.canCreateNewFutureBureau === 'boolean') {
      user.canCreateNewFutureBureau = newVal.canCreateNewFutureBureau;
    }
    if (newVal.role) {
      user.role = newVal.role;
    }
    logger.debug('update user %s to new value %j', user.id, user);
    logger.exit(method);
    user = User.FROM_JSON(stub, user);
    return user.save();
  }

  async judge(stub, judgeOptions) {
    const method = 'static:Judge';
    logger.enter(method);
    let currentFutureBureau = await FutureBureau.Get(stub, judgeOptions);
    currentFutureBureau = FutureBureau.FROM_JSON(currentFutureBureau);
    let currentUser = await User.Get(stub);
    currentUser = User.FROM_JSON(stub, currentUser);
    logger.debug('currentUser name is %s , %s', currentUser.name, typeof (currentUser.name));
    logger.debug('currentFutureBureau judgePerson is %s , %s', currentFutureBureau.judgePerson, typeof (currentFutureBureau.judgePerson));
    if (currentUser.name !== currentFutureBureau.judgePerson) {
      logger.debug('currentUser is %s ', currentUser.id);
      logger.debug('currentFutureBureau`s judgePerson is %s ', currentFutureBureau.judgePerson);
      throw new Error(util.format('Only judgePerson can Judge, current judgePerson is "%s"', currentFutureBureau.judgePerson));
    }
    logger.debug('%s - Result Options Check', method);
    currentFutureBureau.result = judgeOptions.result;
    await FutureBureau.Save(stub, currentFutureBureau.toJSON());
    this.bureau.addNewFutureBureau(currentFutureBureau);
    logger.debug('Judge %s', judgeOptions.futureBureauName);
    logger.debug('result is %s', judgeOptions.result);
    logger.exit(method);
    return this.save();
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
      canCreateNewFutureBureau: false,
      bureau: Bureau.NEW_EMPTY_BUREAU(stub).toJSON(),
    };
    logger.debug('%s - Result user Check in Create %j', method, user);
    return this.Save(stub, user);
  }

  static async Save(stub, userObj) {
    User.CHECK_SAVE_OPTIONS(userObj);
    const user = User.FROM_JSON(stub, userObj);
    logger.debug(' - Result user Check in Save %j', user);
    return user.save();
  }

  static BUILD_USER_KEY(stub, id) {
    return stub.createCompositeKey(USER_PREFIX, [id]);
  }

  static MIX_USER(stub, user, account) {
    const newuser = {
      id: user.id,
      name: user.name,
      role: user.role,
      canCreateNewFutureBureau: user.canCreateNewFutureBureau,
      bureau: user.bureau,
      canCreateNewToken: account.canCreateNewToken,
      wallet: account.wallet,
    };
    return newuser;
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
    if (!TypeChecker.checkString(options.id)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.id', options.id));
    }
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.name', options.name));
    }
    if (!TypeChecker.checkString(options.role)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.role', options.role));
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
    if (options.canCreateNewFutureBureau === undefined) {
      throw new Error(util.format(
        '%s - %j is not a valid User Object, Missing Required property %s',
        method,
        options,
        'canCreateNewFutureBureau',
      ));
    }
    if (!options.bureau) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'bureau'));
    }
    if (!TypeChecker.checkString(options.id)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.id', options.id));
    }
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateUserOption.name', options.name));
    }
    if (!TypeChecker.checkBoolean(options.canCreateNewFutureBureau)) {
      throw new Error(util.format('%j is not a valid Boolean for CreateUserOption.createNewFutureBureau', options.createNewFutureBureau));
    }
  }

  static CHECK_UPDATE_OPTIONS(options) {
    if (options.id) {
      throw new Error('User property id is not allowed to update');
    }
    if (options.wallet) {
      throw new Error('User property wallet is not allowed to update');
    }
    if (options.name) {
      throw new Error('User property name is not allowed to update');
    }
    if (typeof options.canCreateNewToken !== 'undefined' && !TypeChecker.checkBoolean(options.canCreateNewToken)) {
      throw new Error('Property canCreateNewToken should be a valid boolean value');
    }
    if (options.role && !TypeChecker.checkUserRole(options.role)) {
      throw new Error('Property role should be \'user\' or \'admin\'');
    }
  }

  static CHECK_UPDATE_BUREAU_OPTIONS(options) {
    if (options.id) {
      throw new Error('User property id is not allowed to update');
    }
    if (options.bureau) {
      throw new Error('User property bureau is not allowed to update');
    }
    if (options.name) {
      throw new Error('User property name is not allowed to update');
    }
    if (typeof options.canCreateNewFutureBureau !== 'undefined' && !TypeChecker.checkBoolean(options.canCreateNewFutureBureau)) {
      throw new Error('Property canCreateNewFutureBureau should be a valid boolean value');
    }
    if (options.role && !TypeChecker.checkUserRole(options.role)) {
      throw new Error('Property role should be \'user\' or \'admin\'');
    }
  }
  static CHECK_TRANSFER_OPTIONS(options) {
    if (!options) {
      throw new Error('Missing Required TokenTransferRequest');
    }
    if (!options.target) {
      throw new Error('Missing "target" User Id when try to transfer token');
    }
    if (!options.amount) {
      throw new Error('Missing "amount" when try to transfer token');
    }
    if (!options.tokenName) {
      throw new Error('Missing "tokenName" when try to transfer token');
    }
    if (!TypeChecker.checkString(options.target)) {
      throw new Error('Property "target" at transfer request should be of type string');
    }
    if (!TypeChecker.checkString(options.tokenName)) {
      throw new Error('Property "tokenName" at transfer request should be of type string');
    }
    if (!TypeChecker.checkString(options.amount)) {
      throw new Error('Property "amount" at transfer request should be of type string');
    }
    const amount = parseFloat(options.amount);
    if (!TypeChecker.checkUnsignedFloat(amount)) {
      throw new Error('Property "amount" at transfer request should be a valid unsigned float value');
    }
  }

  static CHECK_BETTRANSFER_OPTIONS(options) {
    if (!options) {
      throw new Error('Missing Required BETTokenTransferRequest');
    }
    if (!options.target) {
      throw new Error('Missing "target" User Id when try to transfer token');
    }
    if (!options.chooseOption) {
      throw new Error('Missing "chooseOption" when try to transfer token');
    }
    if (!options.futureBureauName) {
      throw new Error('Missing "futureBureauName" when try to transfer token');
    }
    if (!options.amount) {
      throw new Error('Missing "amount" when try to transfer token');
    }
    const amount = parseFloat(options.amount);
    if (!TypeChecker.checkUnsignedFloat(amount)) {
      throw new Error('Property "amount" at transfer request should be a valid unsigned float value');
    }
  }

  static CHECK_CREATE_TOKEN_OPTIONS(options) {
    if (!options) {
      throw new Error(util.format('Missing Required "CreateTokenRequest" argument'));
    }
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
    if (!TypeChecker.checkUnsignedInt(options.amount)) {
      throw new Error(util.format('%j is not a valid Unsigned Int for CreateUserOption.amount', options.amount));
    }
    if (!TypeChecker.checkUnsignedInt(options.decimals)) {
      throw new Error(util.format('%j is not a valid Unsigned Int for CreateUserOption.decimals', options.decimals));
    }
  }

  static CHECK_CREATE_FUTUREBUREAU_OPTIONS(options) {
    if (!options) {
      throw new Error(util.format('Missing Required "CreateFutureBureauRequest" argument'));
    }
    if (!options.name) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'name'));
    }
    if (!options.endTime) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'endTime'));
    }
    if (!options.option1) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'option1'));
    }
    if (!options.option2) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'option2'));
    }
    if (!options.option3) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'option3'));
    }
    if (!options.option4) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'option4'));
    }
    if (!options.option5) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'option5'));
    }
    if (!options.judgePerson) {
      throw new Error(util.format('%j is not a valid CBO Object, Missing Required property %s', options, 'judgePerson'));
    }
  }

  static CHECK_SETTLE_OPTIONS(options) {
    if (!options) {
      throw new Error(util.format('Missing Required "CBO" argument'));
    }
    if (!options.futureBureauName) {
      throw new Error(util.format('%j is not a valid CBO Object, Missing Required property %s', options, 'futureBureauName'));
    }
    if (!options.result) {
      throw new Error(util.format('%j is not a valid CBO Object, Missing Required property %s', options, 'result'));
    }
  }
}

module.exports = User;
