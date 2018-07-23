const Wallet = require('./Wallet');
const Token = require('./Token');
const Bureau = require('./Bureau');
const FutureBureau = require('./FutureBureau');
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
      canCreateNewFutureBureau: this.canCreateNewToken,
    };
    obj.wallet = this.wallet.toJSON();
    obj.bureau = this.bureau.toJSON();
    return obj;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toBuffer() {
    return Buffer.from(this.toString());
  }

  async createNewToken(opts) {
    const method = 'createNewToken';
    logger.enter(method);
    if (!this.canCreateNewToken) {
      throw new Error('Current user are not allowed to create new Token');
    }
    const createTokenOptions = Object.assign({}, opts);

    try {
      createTokenOptions.decimals = parseInt(createTokenOptions.decimals, 10);
      createTokenOptions.amount = parseInt(createTokenOptions.amount, 10);
    } catch (e) {
      logger.error('%s - Can not parse opts.amount:%s or opts.amount:%s to int, error: %o', method, opts.decimals, opts.amount, e);
      throw new Error('Can not parse CreateNewTokenRequest to a valid number');
    }
    User.CHECK_CREATE_TOKEN_OPTIONS(createTokenOptions);

    if (createTokenOptions.amount.toString() !== opts.amount.toString()) {
      throw new Error('Can not parse decimals or amount to a valid number');
    }

    try {
      const token = await Token.Create(this.stub, createTokenOptions);
      this.wallet.addNewToken(token);
      this.canCreateNewToken = false;
      logger.exit(method);
      return this.save();
    } catch (e) {
      logger.error('%s - Failed to create new Token, Error: %s', method, e.message);
      throw e;
    }
  }

  async createNewFutureBureau(opts) {
    const method = 'createNewFutureBureau';
    logger.enter(method);
    // if (!this.canCreateNewFutureBureau) {
    //   throw new Error('Current user are not allowed to create new FutureBureau');
    // }
    const createFutureBureauOptions = Object.assign({}, opts);

    try {
      createFutureBureauOptions.odds1 = parseFloat(createTokenOptions.odds1, 10);
      createFutureBureauOptions.odds2 = parseDouble(createTokenOptions.odds2, 10);
      createFutureBureauOptions.odds3 = parseDouble(createTokenOptions.odds3, 10);
    } catch (e) {
      logger.error('%s - Can not parse opts.odds1:%s or opts.odds2:%s or opts.odds3:%s to double, error: %o', method, opts.odds1, opts.odds2, odds3, e);
      throw new Error('Can not parse CreateNewFutureBureauRequest to a valid number');
    }
    User.CHECK_CREATE_FutureBureau_OPTIONS(createFutureBureauOptions);

    // if (createFutureBureauOptions.amount.toString() !== opts.amount.toString()) {
    //   throw new Error('Can not parse decimals or amount to a valid number');
    // }

    try {
      const futureBureau = await FutureBureau.Create(this.stub, createFutureBureauOptions);
      this.bureau.addNewFutureBureau(futureBureau);
      // this.canCreateNewFutureBureau = false;
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
  async transfer(opts) {
    const method = 'transfer';
    try {
      logger.enter(method);
      logger.debug('%s - transfer ops %j', method, opts);
      const { target: targetId, tokenName, amount } = opts;
      // check if target user exists
      let target = await User.Get(this.stub, targetId);
      logger.debug('%s - transfer to target %s', method, target.id);
      // transfer, if target user don't have the token, create a new record for target
      const history = {
        from: this.id,
        to: opts.target,
        amount: opts.amount,
      };
      this.wallet.expend(tokenName, amount, history);
      await target.wallet.earn(tokenName, amount, history);
      // save and return
      logger.debug('Save Target user');
      target = await target.save();
      logger.debug(target.toString());
      logger.exit(method);
      return this.save();
    } catch (e) {
      logger.error('%s - Error: %s', e.message);
      throw e;
    }
  }

  async betTransfer(stub, opts) {
    const method = 'betTransfer';
    try {
      logger.enter(method);
      logger.debug('%s - betTransfer opts %j', method, opts);
      const { target: targetId, futureBureauName, tokenName, chooseOption, chooseOdds, amount } = opts;
      // check if target user exists
      let target = await User.Get(this.stub, targetId);
      logger.debug('%s - betTransfer to target %s', method, target.id);
      // betTransfer, if target user don't have the token, create a new record for target
      const history = {
        from: this.id,
        to: opts.target,
        tokenName:opts.tokenName,
        chooseOdds:opts.chooseOdds,
        chooseOption: opts.chooseOption,
        amount: opts.amount,
        timestamp: stub.getTxTimestamp().seconds.low * 1000
      };

      this.wallet.expend(tokenName, amount, history);
      await target.wallet.earn(tokenName, amount, history);

      this.bureau.recordbet(futureBureauName, history);
      
      // save and return
      logger.debug('Save Target user');
      target = await target.save();
      logger.debug(target.toString());
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
    user.canCreateNewToken = obj.canCreateNewToken;
    user.canCreateNewFutureBureau = obj.canCreateNewToken;
    if (obj.wallet === undefined) {
      user.wallet = Wallet.NEW_EMPTY_WALLET(stub);
    } else {
      user.wallet = Wallet.FROM_JSON(stub, obj.wallet);
    }
    if (obj.bureau === undefined) {
      user.bureau = Bureau.NEW_EMPTY_Bureau(stub);
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
    if (currentUser.role !== 'admin') {
      throw new Error(util.format('Only admin can update user info, current user is "%s"', currentUser.role));
    }

    User.CHECK_UPDATE_OPTIONS(newVal);
    logger.debug('%s - Pass Update Options Check', method);

    const user = await User.Get(stub, id);
    if (!user) {
      throw new Error(util.format('Can not find user with id %s', id));
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

  static async Judge(stub, futureBureauName, result) {
    const method = 'static:Judge';
    logger.enter(method);
    let name = futureBureauName;
    const currentFutureBureau = await FutureBureau.Get(stub);
    const currentUser = await User.Get(stub);
    if (currentUser.name !== currentFutureBureau.judgePerson) {
      throw new Error(util.format('Only judgePerson can Judge futureBureau result, current user is "%s"', currentFutureBureau.judgePerson));
    }

    FutureBureau.CHECK_RESULT_OPTIONS(result);

    const futureBureau = await FutureBureau.Get(stub, futureBureauName);
    logger.debug('%s - Result Options Check', method);

    futureBureau.result = result;


    logger.debug('Judge %s', futureBureauName);
    logger.exit(method);
    return futureBureau.save();
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
      wallet: Wallet.NEW_EMPTY_WALLET(stub).toJSON(),
      bureau: Bureau.NEW_EMPTY_Bureau(stub).toJSON(),
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
    if (!options.role) {
      throw new Error(util.format('%s - %j is not a valid User Object, Missing Required property %s', method, options, 'role'));
    }
    if (options.canCreateNewToken === undefined) {
      throw new Error(util.format(
        '%s - %j is not a valid User Object, Missing Required property %s',
        method,
        options,
        'canCreateNewToken',
      ));
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
    if (!options.chooseOdds) {
      throw new Error('Missing "chooseOdds" when try to transfer token');
    }
    if (!options.chooseOption) {
      throw new Error('Missing "chooseOption" when try to transfer token');
    }
    if (!options.futureBureauName) {
      throw new Error('Missing "futureBureauName" when try to transfer token');
    }
    if (!options.tokenName) {
      throw new Error('Missing "tokenName" when try to transfer token');
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

  static CHECK_CREATE_FutureBureau_OPTIONS(options) {
    if (!options) {
      throw new Error(util.format('Missing Required "CreateFutureBureauRequest" argument'));
    }
    if (!options.name) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'name'));
    }
    if (!options.content) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'content'));
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
    if (!options.judgePerson) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'judgePerson'));
    }
    if (!options.odds1) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'odds1'));
    }
    if (!options.odds2) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'odds1'));
    }
    if (!options.odds3) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'odds3'));
    }
  }

  static CHECK_SETTLE_OPTIONS(options) {
    if (!options) {
      throw new Error(util.format('Missing Required "CreateFutureBureauRequest" argument'));
    }
    if (!options.futureBureauName) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'futureBureauName'));
    }
    if (!options.result) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'result'));
    }
  }
}

module.exports = User;
