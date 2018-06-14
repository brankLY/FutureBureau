const User = require('../model/user');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');

// id, name, role
async function createUser(stub, params) {
  const method = 'createUser';
  try {
    logger.enter(method);
    if (params.length !== 3) {
      logger.error('%s - Create new User requires params of length 3, found %s, %j', method, params.length, params);
      return Response(false, 'Create new User requires params of length 3');
    }
    const opts = {
      id: params[0],
      name: params[1],
      role: params[2],
    };
    logger.debug('%s - Check if user %s exists', method, opts.id);
    const exists = await User.Exists(stub, opts.id);
    if (exists) {
      logger.error('%s - User with id %s already exists', method, opts.id);
      return Response(false, `User with id ${opts.id} already exists`);
    }
    logger.debug('%s - Create new User with options %j', method, opts);
    const res = await User.Create(stub, opts);
    logger.debug('%s - Successfully create new User in bc, response: %s', method, res);
    return Response(true, res);
  } catch (e) {
    logger.error('%s - Error: %o', method, e);
    return Response(false, e.message);
  }
}

module.exports = createUser;
