const util = require('util');
const User = require('../model/User');
const TypeChecker = require('../utils/TypeChecker');
const { FUTUREBUREAU_PREFIX } = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('FutureBureau');

const IdentityService = require('../acl/IdentityService');

const math = require('mathjs');

math.config({
  number: 'BigNumber',
  precision: 18, // default precision to 18
});

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
    };
  }

  addHistory(from, to, tokenName, chooseOption, amount, timestamp) {
    this.history.push({
      from,
      to,
      tokenName,
      chooseOption,
      amount,
      timestamp,
    });
  }

  addFutureBureauUser(user) {
    const method = 'addFutureBureauUser';
    logger.enter(method);
    if (this.users[user.id]) {
      throw new Error(util.format('FutureBureau already exists in user %s', user.id));
    }
    this.users[user.id] = user;
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


  /**
   * Create a new FutureBureau
   *
   * @param {Stub} stub
   * @param {CreateFutureBureauOption} options
   * @return {Promise<FutureBureau>}
   */
  static async Create(stub, options) {
    FutureBureau.CHECK_CREATE_OPTIONS(options);
    const exists = await this.Exists(stub, options);
    if (exists) {
      throw new Error(util.format('FutureBureau with name %s already exists', options.name));
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
      judgePerson: options.judgePerson,
      result: 'Undecided',
    };

    await this.Save(stub, futureBureauObj);
    const futureBureau = this.FROM_JSON(stub, futureBureauObj);
    futureBureau.addHistory(id, id, 'GZH', 'option', 0, stub.getTxTimestamp().seconds.low * 1000);
    const user = await User.Get(stub);
    futureBureau.addFutureBureauUser(user);
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


  static async Get(stub, futureBureauName) {
    const method = 'Get';
    logger.enter(method);
    const name = futureBureauName;

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
    return FutureBureau.FROM_JSON(stub, futureBureau);
  }

  /**
   * yarn
   * Create a FutureBureau instance from Json
   * @param obj
   * @return {FutureBureau}
   * @constructor
   */
  static FROM_JSON(stub, obj) {
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
    futureBureau.judgePerson = obj.judgePerson;
    futureBureau.history = obj.history || [];
    futureBureau.result = obj.result;
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
      futureBureau.judgePerson = futureBureauInfo.judgePerson;
      futureBureau.result = '';
      futureBureau.history = [];
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
    if (!options.creator) {
      throw new Error(util.format('%j is not a valid CreateFutureBureauOption Object, Missing Required property %s', options, 'creator'));
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
    if (!TypeChecker.checkString(options.creator)) {
      throw new Error(util.format('%j is not a valid string for CreateFutureBureauOption.symbol', options.creator));
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
