const util = require('util');
const TypeChecker = require('../utils/TypeChecker');
const { FUTUREBUREAU_PREFIX } = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('FutureBureau');

const IdentityService = require('../acl/IdentityService');

const math = require('mathjs');

math.config({
  number: 'BigNumber',
  precision: 18, // default precision to 18
});
let futureBureaus = {
  bureauNames: [],
};
class FutureBureau {
  toJSON() {
    return {
      name: this.name,
      creator: this.creator,
      content: this.content,
      createTime: this.createTime,
      endTime: this.endTime,
      option1: this.option1,
      option2: this.option2,
      option3: this.option3,
      option4: this.option4,
      option5: this.option5,
      judgePerson: this.judgePerson,
      history: this.history,
      result: this.result,
      users: this.users,
      count: this.count,
      count1: this.count1,
      count2: this.count2,
      count3: this.count3,
      count4: this.count4,
      count5: this.count5,
    };
  }
  addHistory(from, tokenName, chooseOption, amount, timestamp) {
    this.history.push({
      from,
      tokenName,
      chooseOption,
      amount,
      timestamp,
    });
  }
  addFutureBureauUser(user) {
    const method = 'addFutureBureauUser';
    logger.enter(method);
    this.users[user] = 1;
    logger.debug('%j - Result: %s', this.users, this.users[user]);
    logger.exit(method);
  }

  /**
   * Check if a type of futureBureau exists.
   *
   * @param {CreateFutureBureauOptions} options
   * @return {Promise<boolean>}
   *   - true: the futureBureau with current name already exists
   *   - false: the futureBureau is not exist, so we can create new futureBureau with this name
   */
  static async Exists(stub, options) {
    const method = 'static:Exists';
    // TODO: perform complex query to check if futureBureau with this name exists
    logger.enter(method);
    const { name } = options;
    logger.debug('%s - Check if FutureBureau %s exists', method, name);
    const key = FutureBureau.BUILD_FUTUREBUREAU_KEY(stub, name);
    const futureBureau = (await stub.getState(key)).toString('utf8');
    logger.debug('%s - Result: %s', method, !!futureBureau);
    logger.exit(method);
    return !!futureBureau;
  }
  static async getAll(stub) {
    const method = 'static:getAll';
    // TODO: perform complex query to check if futureBureau with this name exists
    logger.enter(method);
    let record;
    try {
      record = (await stub.getState('FutureBureauRecord')).toString('utf8');
      logger.debug('%s - record', record);
    } catch (e) {
      logger.error('%s - Failed to test New FutureBureau Info, Error: %j', method, e.message);
      throw e;
    }
    if (!record) {
      logger.error('%s - Can not find FutureBureau %s', method, futureBureaus);
      throw new Error(util.format('FutureBureau %s does not exist', futureBureaus));
    }
    record = JSON.parse(record);
    return record;
  }
  /**
   * Create a new FutureBureau
   *
   * @param {Stub} stub
   * @param {CreateFutureBureauOption} options
   * @return {Promise<FutureBureau>}
   */
  static async Create(stub, options) {
    const method = 'CreateFutureBureau';
    FutureBureau.CHECK_CREATE_OPTIONS(options);
    const exists = await this.Exists(stub, options);
    if (exists) {
      throw new Error(util.format('%s FutureBureau with name %s already exists', method, options.name));
    }

    const identityService = new IdentityService(stub);
    const id = identityService.getName();

    const futureBureauObj = {
      name: options.name,
      creator: id,
      content: options.content,
      createTime: stub.getTxTimestamp().seconds.low * 1000,
      endTime: options.endTime,
      option1: options.option1,
      option2: options.option2,
      option3: options.option3,
      option4: options.option4,
      option5: options.option5,
      count: 0,
      count1: 0,
      count2: 0,
      count3: 0,
      count4: 0,
      count5: 0,
      judgePerson: options.judgePerson,
      result: 'Undecided',
    };

    await this.Save(stub, futureBureauObj);
    const futureBureau = this.FROM_JSON(futureBureauObj);
    futureBureaus = (await stub.getState('FutureBureauRecord')).toString('utf8');
    futureBureaus = JSON.parse(futureBureaus);
    futureBureaus.bureauNames.push(options.name);
    logger.debug('%s - FutureBureaus are %s ', method, futureBureaus.bureauNames);
    try {
      await stub.putState('FutureBureauRecord', Buffer.from(JSON.stringify(futureBureaus)));
    } catch (e) {
      logger.error('%s - Failed to test Info, Error: %j', method, e.message);
      throw e;
    }
    logger.debug('%s - FutureBureaus are %s in Create ', method, JSON.stringify(futureBureaus));
    // futureBureau.addHistory(id, id, 'GZH', 'option1', 0, stub.getTxTimestamp().seconds.low * 1000);
    await this.Save(stub, futureBureau.toJSON());
    return futureBureau;
  }

  static async Save(stub, futureBureau) {
    const method = 'static:Save';
    try {
      const key = this.BUILD_FUTUREBUREAU_KEY(stub, futureBureau.name);
      const serializedFutureBureau = JSON.stringify(futureBureau);
      await stub.putState(key, Buffer.from(serializedFutureBureau));
    } catch (e) {
      logger.error('%s - Failed to Save New FutureBureau Info, Error: %j', method, e.message);
      throw e;
    }
  }

  static async recordBet(stub, targetBureau, optionsRequest) {
    const method = 'recordBet';
    const opts = Object.assign({}, optionsRequest);
    try {
      logger.enter(method);
      const futureBureau = targetBureau;
      logger.debug('%s - Expend %s amount %s, targetBureau: %s', method, opts.amount, opts.tokenName, futureBureau.name);
      futureBureau.addHistory(opts.from, opts.tokenName, opts.chooseOption, opts.amount, opts.timestamp);
      logger.debug('%s 9999', opts.amount);
      // futureBureau.addFutureBureauUser(opts.from);
      switch (opts.chooseOption) {
        case 'option1':
          futureBureau.count1 = math.add(futureBureau.count1, opts.amount);
          futureBureau.count = math.add(futureBureau.count, opts.amount);
          logger.debug('%s 99998888', futureBureau.count1);
          break;
        case 'option2':
          futureBureau.count2 = math.add(futureBureau.count2, opts.amount);
          futureBureau.count = math.add(futureBureau.count, opts.amount);
          logger.debug('%s 99998888', futureBureau.count2);
          break;
        case 'option3':
          futureBureau.count3 = math.add(futureBureau.count3, opts.amount);
          futureBureau.count = math.add(futureBureau.count, opts.amount);
          logger.debug('%s 99998888', futureBureau.count3);
          break;
        case 'option4':
          futureBureau.count4 = math.add(futureBureau.count4, opts.amount);
          futureBureau.count = math.add(futureBureau.count, opts.amount);
          logger.debug('%s 99998888', futureBureau.count4);
          break;
        case 'option5':
          futureBureau.count5 = math.add(futureBureau.count5, opts.amount);
          futureBureau.count = math.add(futureBureau.count, opts.amount);
          logger.debug('%s 99998888', futureBureau.count5);
          break;
        default:
          logger.debug('%s 99998888', futureBureau.count);
          break;
      }
      await this.Save(stub, futureBureau.toJSON());
      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }

  static async Get(stub, options) {
    const method = 'Get';
    logger.enter(method);
    const name = options.futureBureauName;
    logger.debug('%s - get FutureBureau %s', method, name);

    const key = FutureBureau.BUILD_FUTUREBUREAU_KEY(stub, name);
    let futureBureau = (await stub.getState(key)).toString('utf8');
    if (!futureBureau) {
      logger.error('%s - Can not find FutureBureau %s', method, name);
      throw new Error(util.format('FutureBureau %s does not exist', name));
    }
    futureBureau = JSON.parse(futureBureau);
    logger.debug('%s - Successfully get futureBureau from bc. %j', method, futureBureau);
    logger.exit(method);
    return futureBureau;
  }
  /**
   * yarn
   * Create a FutureBureau instance from Json
   * @param obj
   * @return {FutureBureau}
   * @constructor
   */
  static FROM_JSON(obj) {
    const futureBureau = new FutureBureau();
    futureBureau.name = obj.name;
    futureBureau.creator = obj.creator;
    futureBureau.content = obj.content;
    futureBureau.createTime = obj.createTime;
    futureBureau.endTime = obj.endTime;
    futureBureau.option1 = obj.option1;
    futureBureau.option2 = obj.option2;
    futureBureau.option3 = obj.option3;
    futureBureau.option4 = obj.option4;
    futureBureau.option5 = obj.option5;
    futureBureau.count = obj.count;
    futureBureau.count1 = obj.count1;
    futureBureau.count2 = obj.count2;
    futureBureau.count3 = obj.count3;
    futureBureau.count4 = obj.count4;
    futureBureau.count5 = obj.count5;
    futureBureau.judgePerson = obj.judgePerson;
    futureBureau.history = obj.history || [];
    futureBureau.result = obj.result;
    futureBureau.gas = obj.gas;
    return futureBureau;
  }

  static async NEW_EMPTY_FUTUREBUREAU(stub, name) {
    const method = 'NEW_EMPTY_FUTUREBUREAU';
    try {
      logger.enter(method);
      const key = this.BUILD_FUTUREBUREAU_KEY(stub, name);
      let futureBureauInfo = (await stub.getState(key)).toString('utf8');
      if (!futureBureauInfo) {
        throw new Error(util.format('Can not found futureBureau %s from bc', name));
      }
      const identityService = new IdentityService(stub);
      const id = identityService.getName();
      futureBureauInfo = JSON.parse(futureBureauInfo);
      const futureBureau = new FutureBureau();
      futureBureau.name = futureBureauInfo.name;
      futureBureau.creator = id;
      futureBureau.content = futureBureauInfo.content;
      futureBureau.createTime = stub.getTxTimestamp().seconds.low * 1000;
      futureBureau.endTime = futureBureauInfo.endTime;
      futureBureau.option1 = futureBureauInfo.option1;
      futureBureau.option2 = futureBureauInfo.option2;
      futureBureau.option3 = futureBureauInfo.option3;
      futureBureau.option4 = futureBureauInfo.option4;
      futureBureau.option5 = futureBureauInfo.option5;
      futureBureau.count = 0;
      futureBureau.count1 = 0;
      futureBureau.count2 = 0;
      futureBureau.count3 = 0;
      futureBureau.count4 = 0;
      futureBureau.count5 = 0;
      futureBureau.judgePerson = futureBureauInfo.judgePerson;
      futureBureau.result = '';
      futureBureau.history = [];
      futureBureau.gas = 0;
      logger.exit(method);
      return futureBureau;
    } catch (e) {
      throw e;
    }
  }


  static BUILD_FUTUREBUREAU_KEY(stub, name) {
    return stub.createCompositeKey(FUTUREBUREAU_PREFIX, [name]);
  }

  /**
   * Check if the options is a valid {@link CreateFutureBureauOption} object
   *
   * @param {CreateFutureBureauOption} options
   * @throws Error if some check failed.
   */
  static CHECK_CREATE_OPTIONS(options) {
    if (!options.name) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'name'));
    }
    if (!options.content) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'content'));
    }
    if (!options.judgePerson) {
      throw new Error(util.format('%j is not a valid CreFutBureauOption Object, Missing Required property %s', options, 'judgePerson'));
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
    if (!TypeChecker.checkString(options.name)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.name', options.name));
    }
    if (!TypeChecker.checkString(options.content)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.content));
    }
    if (!TypeChecker.checkString(options.endTime)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.endTime));
    }
    if (!TypeChecker.checkString(options.judgePerson)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.judgePerson));
    }
    if (!TypeChecker.checkString(options.option1)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.option1));
    }
    if (!TypeChecker.checkString(options.option2)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.option2));
    }
    if (!TypeChecker.checkString(options.option3)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.option3));
    }
    if (!TypeChecker.checkString(options.option4)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.option1));
    }
    if (!TypeChecker.checkString(options.option5)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.option2));
    }
  }
}

//   static CHECK_JUDGE_OPTIONS(options) {
//     if (options.name) {
//       throw new Error('User property name is not allowed to update');
//     }
//   }

//   static CHECK_RESULT_OPTIONS(options) {
//     if (options.result) {
//       throw new Error('User property name is not allowed to judge result.');
//     }
//   }
// }

module.exports = FutureBureau;
