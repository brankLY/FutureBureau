/* eslint-disable no-unused-expressions */
const Stub = require('../mock-stub');
const {expect} = require('chai');

const stub = new Stub();

const User = require('../../lib/model/user');
const USER_PREFIX = 'earth.user';

describe('Test User', () => {
  before(async () => {
    await stub.reset();
  });
  it('Constructor Test', () => {
    try {
      new User();
    } catch (e) {

    }
  });

  it('Create new User with CreateUserOption should success', async () => {
    const opts = {
      id: 'test',
      name: 'zhangsan',
      org: 'org1',
      role: 'user',
    };
    await User.Create(stub, opts);

    let user = await stub.getState(stub.createCompositeKey(USER_PREFIX, [opts.id]));
    expect(user).exist;
    user = user.toString('utf8');
    user = JSON.parse(user);
    expect(user.id).to.equal(opts.id);
    expect(user.name).to.equal(opts.name);
    expect(user.org).to.equal(opts.org);
    expect(user.role).to.equal(opts.role);
    expect(user.wallets).to.deep.equal([]);
    expect(user.canCreateNewToken).to.equal(false);
  });

  it('Get user by the common name of the certificate should success', async () => {

  });

  it('Test exists', async () => {
    let res = await User.Exists(stub, 'test');
    expect(res).to.equal(true);
    res = await User.Exists(stub, 'dummy');
    expect(res).to.eql(false);
  });
});
