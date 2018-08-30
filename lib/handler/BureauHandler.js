const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
// const User = require('../model/User');
const FutureBureau = require('../model/FutureBureau');

const EARTH_CHAINCODE_ID = 'e24ea80d-d703-47a3-88af-1c69f21b025d';

class BureauHandler {
  /**
   * Sample code for create new contract account on Earth chaincode
   * This method will create an account of type "contract" at Earth
   *
   * @param {ChaincodeStub} stub
   * @param {string} contractAccountId the contract account for this Dapp at Earth
  */
  static async initContractAccount(stub, params) {
    const method = 'initContractAccount';
    logger.debug('%s - enter', method);
    let Request;
    try {
      Request = JSON.parse(params[0]);
    } catch (e) {
      return Response(false, 'Can not parse request params[0] to a Object');
    }
    try {
      logger.debug('%s - creater contractAccount %s', method, params[0]);
      await stub.putState('Dapp_futurebureau', Buffer.from(Request.contractAccountId));
      // create a new Contract Account at Earth
      logger.debug('%s - creater contractAccount %s', method, Request.contractAccountId);
      // const params = ['account.create', contractAccountId, 'Dapp_futurebureau'];
      const account = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['account.create', Request.contractAccountId, 'Dapp_futurebureau']);
      logger.debug('Successfully created new Account at Earth %s', account.payload.toString('utf8'));
      // console.log(response);
      // const tx = {
      //   method,
      //   params,
      // }
      // const resp = handleInvokeCCResp(JSON.stringify(tx), response);
      // logger.debug('%s - create contract account response: %j', method, resp);
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
      const futureBureaus = FutureBureau.getAll(stub);
      logger.debug('%s - Successfully get User from bc, response: %j', method, futureBureaus);
      logger.exit(method);
      return Response(true, futureBureaus.toString('utf8'));
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}
module.exports = BureauHandler;
