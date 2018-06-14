const User = require('../model/user');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');

// id, name, role
async function getUser(stub, params) {
  const method = 'getUser';
  try {
    logger.enter(method);
    if (params.length !== 0) {
      logger.error('%s - Query User requires params of length 0, found %s, %j', method, params.length, params);
      return Response(false, 'Create new User requires params of length 0');
    }
    logger.debug('%s - Query User', method);
    const user = await User.Get(stub);
    logger.debug('%s - Successfully get User from bc, response: %s', method, user.toString());
    logger.exit(method);
    return Response(true, user.toString());
  } catch (e) {
    logger.error('%s - Error: %o', method, e);
    return Response(false, e.message);
  }
}

module.exports = getUser;
