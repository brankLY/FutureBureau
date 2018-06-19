const Token = require('../model/Token');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');

class TokenHandler {
  // params[0]: id
  // params[1]: name
  static async create(stub, params) {
    const method = 'create';
    try {
      logger.enter(method);
      if (params.length !== 2) {
        logger.error('%s - Create new User requires params of length 2, found %s, %j', method, params.length, params);
        return Response(false, 'Create new User requires params of length 2');
      }
      const opts = {
        id: params[0],
        name: params[1],
        role: 'user',
      };
      logger.debug('%s - Create new User with options %j', method, opts);
      const token = await Token.Create(stub, opts);
      logger.debug('%s - Successfully create new User in bc, response: %s', method, token.toString());
      return Response(true, token.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = TokenHandler;
