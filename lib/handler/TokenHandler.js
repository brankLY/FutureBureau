const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
const User = require('../model/User');

const EARTH_CHAINCODE_ID = 'e24ea80d-d703-47a3-88af-1c69f21b025d';

class TokenHandler {
  static async GetTokenInfo(stub, params) {
    const method = 'GetTokenInfo';
    try {
      logger.enter(method);
      if (params.length !== 1) {
        logger.error('%s - Query Token Info requires params of length 1, found %s, %j', method, params.length, params[0]);
        return Response(false, 'GetTokenInfo requires params of length 1');
      }
      logger.debug('%s - query requires params is: %s', method, params);
      let token = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['token.getInfo', params[0]]);
      token = token.payload.toString('utf8');
      logger.debug('%s - Successfully query Token in bc, response: %s', method, token);
      return Response(true, token);
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
  // params: [name, symbol, decimals, amount]
  static async createToken(stub, params) {
    const method = 'createToken';
    try {
      logger.enter(method);
      logger.debug('%s - Create new Token with params %j', method, params);
      if (params.length !== 1) {
        logger.error('%s - Create new Token requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Create new Token requires params of length 1');
      }
      // let createTokenRequest;
      // try {
      //   createTokenRequest = JSON.parse(params[0]);
      // } catch (e) {
      //   return Response(false, 'Can not parse request params[0] to a createTokenRequest Object');
      // }
      // user = await user.createNewToken(createTokenRequest);
      const account = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['token.create', params[0]]);
      const user = await User.Get(stub);
      logger.debug('- invokeChaincode Options:%j', account);
      logger.debug('%s - Successfully create new Token in bc, response: %s', method, user.toString());
      return Response(true, JSON.stringify(user));
    } catch (e) {
      logger.error('%s - Error: %s, stack: %O', method, e.message, e.stack);
      return Response(false, e.message);
    }
  }
  static async Update(stub, params) {
    const method = 'Update';
    try {
      logger.enter(method);

      logger.debug('%s - Update requires params is: %s', method, params[0]);
      let token = await stub.invokeChaincode(EARTH_CHAINCODE_ID, ['token.update', params[0]]);
      token = token.payload.toString('utf8');
      logger.debug('%s - Successfully updated Token %s in bc, response: %s', method, token.symbol, token);
      return Response(true, token.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}
module.exports = TokenHandler;
