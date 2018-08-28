const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
// const User = require('../model/User');

const EARTH_CHAINCODE_ID = 'e24ea80d-d703-47a3-88af-1c69f21b025d';

class BureauHandler {
  /**
   * Sample code for create new contract account on Earth chaincode
   * This method will create an account of type "contract" at Earth
   *
   * @param {ChaincodeStub} stub
   * @param {string} contractAccountId the contract account for this Dapp at Earth
  */
  static async initContractAccount(stub, contractAccountId) {
    const method = 'initContractAccount';
    logger.debug('%s - enter', method);
    try {
      logger.debug('%s - creater contractAccount %s', method, contractAccountId);
      await stub.putState('futurebureau', Buffer.from(contractAccountId));
      // create a new Contract Account at Earth
      logger.debug('%s - creater contractAccount %s', method, contractAccountId);
      // const params = ['account.create', contractAccountId, 'Dapp_futurebureau'];
      const account = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['account.create', contractAccountId, 'Dapp_futurebureau']);
      logger.debug('Successfully created new Account at Earth');
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
}
module.exports = BureauHandler;
