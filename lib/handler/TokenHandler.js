const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');

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

      let token = stub.invokeChaincode(EARTH_CHAINCODE_ID, ['token.getInfo', params]);
      // token = token.payload.toString('utf8');
      logger.debug('%s - Successfully created new Token in bc, response: %s', method, token);
      return Response(true, token);
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
  // static async Update(stub, params) {
  //   const method = 'Update';
  //   try {
  //     logger.enter(method);
  //     const updateTokenReq = getCreateTokenRequestFromParams(params);

  //     const token = new Token(stub);
  //     await token.update(updateTokenReq);
  //     logger.debug('%s - Successfully updated Token %s in bc, response: %s', method, token.symbol, token.toString());
  //     return Response(true, token.toString());
  //   } catch (e) {
  //     logger.error('%s - Error: %o', method, e);
  //     return Response(false, e.message);
  //   }
  // }
}
module.exports = TokenHandler;
