const Stub = require('../mock-stub');
const assert = require('assert');

const stub = new Stub();


const User = require('../../lib/model/user');

describe('Test User', () => {
  it('Constructor Test', () => {
    console.log('TDB');
  });

  it('Create new User with CreateUserOption should success', async () => {
    const opts = {
      id: 'test',
      name: 'zhangsan',
      org: 'org1',
      role: 'student',
    };
    await User.Create(stub, opts);

    let user = (await stub.getState(opts.id)).toString('utf8');
    user = JSON.parse(user);
    assert.equal(user.id, opts.id);
    assert.equal(user.name, opts.name);
    assert.equal(user.org, opts.org);
    assert.equal(user.role, opts.role);
    assert.deepEqual(user.wallets, []);
  });

  it('Get user by the common name of the certificate should success', async () => {

  });

  it('Test exists', async () =>{
    let res = await User.Exists(stub, 'test');
    assert.equal(res, true, 'user should exist');
    res = await User.Exists(stub, 'dummy');
    assert.equal(res, false, 'user should not exist');
  });
});
