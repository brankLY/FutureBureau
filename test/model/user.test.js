/* eslint-disable no-unused-expressions */
const Stub = require('../mock-stub');
const {expect} = require('chai');

const stub = new Stub();

const User = require('../../lib/model/User');

describe('Test User', () => {
  before(async () => {
    await stub.reset();
  });
  it('Constructor Test', () => {
    try {
      // eslint-disable-next-line no-new
      new User();
    } catch (e) {
      expect(e.message).to.equal('Missing Required Argument stub');
    }
  });

  it('Create new User with CreateUserOption should success', async () => {
    const opts = {
      id: 'admin',
      name: 'zhangsan',
      role: 'user',
    };
    const user = await User.Create(stub, opts);

    expect(user).exist;
    expect(user.id).to.equal(opts.id);
    expect(user.name).to.equal(opts.name);
    expect(user.role).to.equal(opts.role);
    expect(user.wallet).to.deep.equal([]);
    expect(user.canCreateNewToken).to.equal(false);

  });

  it('Create new User with a wrong id should throw error', async () => {
    try {
      const opts = {
        id: 'user0',
        name: 'zhangsan',
        role: 'user',
      };
      await User.Create(stub, opts);
      expect.fail();
    } catch (e) {
      expect(e.message).to.equal('Identity admin do not have permission to create new User user0');
    }
  });

  it('Get user by the common name of the certificate should success', async () => {
    const admin = await User.Get(stub);
    expect(admin).exist;
    expect(admin.id).to.equal('admin');
    expect(admin.name).to.equal('zhangsan');
    expect(admin.role).to.equal('user');
    expect(admin.canCreateNewToken).to.equal(false);
    expect(admin.wallet).to.deep.equal([]);
    expect(admin.constructor.name).to.equal('User');
  });

  it('Admin user can update a common user so that this common user can create new token', async () => {
    const updatedUser = await User.Update(stub, 'admin', {canCreateNewToken: true});
    expect(updatedUser).exist;
    expect(updatedUser.id).to.equal('admin');
    expect(updatedUser.name).to.equal('zhangsan');
    expect(updatedUser.role).to.equal('user');
    expect(updatedUser.canCreateNewToken).to.equal(true);
    expect(updatedUser.wallet).to.deep.equal([]);
    expect(updatedUser.constructor.name).to.equal('User');
  });

  it('Test exists', async () => {
    let res = await User.Exists(stub, 'admin');
    expect(res).to.equal(true);
    res = await User.Exists(stub, 'dummy');
    expect(res).to.equal(false);
  });
});
