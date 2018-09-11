const Response = require('../utils/Response');
const {
  FUTUREBUREAU_CHAINCODE_ID,
  EARTH_CHAINCODE_ID,
} = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('handler');
const FutureBureau = require('../model/FutureBureau');

class BureauHandler {
  /**
   * Sample code for create new contract account on Earth chaincode
   * This method will create an account of type "contract" at Earth
   *
   * @param {ChaincodeStub} stub
   * @param {string} contractAccountId the contract account for this Dapp at Earth
  */
  static async initContractAccount(stub) {
    const method = 'initContractAccount';
    logger.debug('%s - enter', method);
    try {
      logger.debug('%s - creater contractAccount %s', method, FUTUREBUREAU_CHAINCODE_ID);
      await stub.putState('Dapp_futurebureau', Buffer.from(FUTUREBUREAU_CHAINCODE_ID));
      logger.debug('%s - creater contractAccount %s', method, FUTUREBUREAU_CHAINCODE_ID);
      const initContractAccountRequest = {
        id: FUTUREBUREAU_CHAINCODE_ID,
        name: 'Dapp_futurebureau',
        role: 'contract',
      };
      const account = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['account.create', JSON.stringify(initContractAccountRequest)]);
      logger.debug('Successfully created contractAccount');
      logger.debug('%s - exit', method);
      return Response(true, account.payload.toString('utf8'));
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

  static async getAll(stub) {
    const method = 'getAll';
    try {
      logger.enter(method);
      logger.debug('%s - Query futureBureau', method);
      const futureBureaus = await FutureBureau.getAll(stub);
      logger.debug('%s - Successfully get User from bc, response: %s', method, futureBureaus.toString('utf8'));
      logger.exit(method);
      return Response(true, JSON.stringify(futureBureaus));
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
  // static async countBureau(stub, params){
  //   const method = 'getAll';
  //   let count1 = 0;
  //   let count2 = 0;
  //   let count3 = 0;
  //   let count4 = 0;
  //   let count5 = 0;
  //   bureau.forEach(() =>{
  //       logger.debug('bureau name', bureau.name);
  //       if (bureau.name === params[0]){
  //         count1 = math.add(bureau.count1, count1);
  //         count2 = math.add(bureau.count2, count2);
  //         count3 = math.add(bureau.count3, count3);
  //         count4 = math.add(bureau.count4, count4);
  //         count5 = math.add(bureau.count5, count5);
  //       }
  //     })
  //   const result ={
  //     count1: count1,
  //     count2: count2,
  //     count3: count3,
  //     count4: count4,
  //     count5: count5,
  //   }
  // }
}
module.exports = BureauHandler;
