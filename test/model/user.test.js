/* eslint-disable no-unused-expressions */
const Stub = require('../mock-stub');
const { expect } = require('chai');

const stub = new Stub();

const User = require('../../lib/model/User');

describe('Test User', () => {
  const target = {
    id: '9ec73604-0225-4d99-83d7-b858b499e639',
    name: 'user0',
    role: 'user',
  };
  // cert for target user {{{
  const cert = '-----BEGIN CERTIFICATE-----\n' +
    'MIICwDCCAmagAwIBAgIUMdfKxK9vzQMDyfn6wtOJunKqtMMwCgYIKoZIzj0EAwIw\n' +
    'czELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\n' +
    'biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\n' +
    'E2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgwNjE3MDM1MjAwWhcNMTkwNjE3MDM1\n' +
    'NzAwWjBaMSkwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMAsGA1UECxMEdXNl\n' +
    'cjEtMCsGA1UEAxMkOWVjNzM2MDQtMDIyNS00ZDk5LTgzZDctYjg1OGI0OTllNjM5\n' +
    'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEE+t8qJ2Qjy77iFUl2gE1OSuZ9QOI\n' +
    'AserxOui7FEeeqTJarokt0fDxEeIbdbFQdZbhN8AVHwrtNi4MPuHlRrRCaOB8DCB\n' +
    '7TAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQU9BGghcE0\n' +
    'm2PTpmT9MYDr2BL1jLAwKwYDVR0jBCQwIoAgllQHfJm2YorpFTfWi4KWa0D2MgN5\n' +
    'y8FPH9iCpNq8lZQwgYAGCCoDBAUGBwgBBHR7ImF0dHJzIjp7ImhmLkFmZmlsaWF0\n' +
    'aW9uIjoib3JnMS51c2VyIiwiaGYuRW5yb2xsbWVudElEIjoiOWVjNzM2MDQtMDIy\n' +
    'NS00ZDk5LTgzZDctYjg1OGI0OTllNjM5IiwiaGYuVHlwZSI6ImNsaWVudCJ9fTAK\n' +
    'BggqhkjOPQQDAgNIADBFAiEAwGbq0Z7wqTQm/vG2TU4y1IniWHhoitqLzW81+IOH\n' +
    'd+ACIACp77nySZ2j8JrY5MEDXrTd3ua+hOdAoAwARDp6e2ug\n' +
    '-----END CERTIFICATE-----\n';
  // }}}

  before(async () => {
    await stub.reset();
  });

  // Constructor Test {{{
  it('Constructor Test', () => {
    try {
      // eslint-disable-next-line no-new
      new User();
    } catch (e) {
      expect(e.message).to.equal('Missing Required Argument stub');
    }
  });
  // }}}

  // Create new User without correct CreateUserOption should throw error {{{
  it('Create new User without correct CreateUserOption should throw error', async () => {
    try {
      await User.Create(stub);
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('Missing Required param options or options is not a valid object');
    }

    try {
      await User.Create(stub, 'dummy');
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('Missing Required param options or options is not a valid object');
    }

    try {
      await User.Create(stub, {});
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('{} is not a valid CreateUserOption Object, Missing Required property id');
    }

    try {
      await User.Create(stub, { id: 'admin' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('{"id":"admin"} is not a valid CreateUserOption Object, Missing Required property name');
    }

    try {
      await User.Create(stub, { id: 'admin', name: 'zhangsan' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('{"id":"admin","name":"zhangsan"} is not a valid CreateUserOption Object, Missing Required property role');
    }

    try {
      await User.Create(stub, { id: 123, name: 'zhangsan', role: 'admin' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('123 is not a valid string for CreateUserOption.id');
    }

    try {
      await User.Create(stub, { id: 'admin', name: 123, role: 'admin' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('123 is not a valid string for CreateUserOption.name');
    }

    try {
      await User.Create(stub, { id: 'admin', name: 'zhangsan', role: 123 });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('123 is not a valid string for CreateUserOption.role');
    }
  });
  // }}}

  // Create new User with CreateUserOption should success {{{
  it('Create new User with CreateUserOption should success', async () => {
    const opts = {
      id: 'admin',
      name: 'zhangsan',
      role: 'admin',
    };
    const user = await User.Create(stub, opts);

    expect(user).exist;
    expect(user.id).to.equal(opts.id);
    expect(user.name).to.equal(opts.name);
    expect(user.role).to.equal(opts.role);
    expect(user.wallet.tokens).to.deep.equal({});
    expect(user.bureau.futureBureaus).to.deep.equal({});
    expect(user.canCreateNewToken).to.equal(false);
  });
  // }}}

  // Create new User with a wrong id should throw error {{{
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
  // }}}

  // Test exists {{{
  it('Test exists', async () => {
    let res = await User.Exists(stub, 'admin');
    expect(res).to.equal(true);
    res = await User.Exists(stub, 'dummy');
    expect(res).to.equal(false);
  });
  // }}}

  // Get user by the common name of the certificate should success {{{
  it('Get user by the common name of the certificate should success', async () => {
    let admin = await User.Get(stub);
    expect(admin).exist;
    expect(admin.id).to.equal('admin');
    expect(admin.name).to.equal('zhangsan');
    expect(admin.role).to.equal('admin');
    expect(admin.canCreateNewToken).to.equal(false);
    expect(admin.wallet).exist;
    expect(admin.bureau).exist;
    expect(admin.wallet.tokens).to.deep.equal({});
    expect(admin.bureau.futureBureaus).to.deep.equal({});
    expect(admin.constructor.name).to.equal('User');

    let resp = admin.toString();
    resp = JSON.parse(resp);
    expect(resp).exist;
    expect(resp.id).to.equal('admin');
    expect(resp.name).to.equal('zhangsan');
    expect(resp.role).to.equal('admin');
    expect(resp.canCreateNewToken).to.equal(false);
    expect(resp.wallet).to.deep.equal({});
    expect(resp.bureau).to.deep.equal({});

    admin = User.FROM_JSON(stub, resp);
    expect(admin).exist;
    expect(admin.id).to.equal('admin');
    expect(admin.name).to.equal('zhangsan');
    expect(admin.role).to.equal('admin');
    expect(admin.canCreateNewToken).to.equal(false);
    expect(admin.wallet).exist;
    expect(admin.bureau).exist;
    expect(admin.wallet.tokens).to.deep.equal({});
    expect(admin.bureau.futureBureaus).to.deep.equal({});
    expect(admin.constructor.name).to.equal('User');
    expect(admin.wallet.constructor.name).to.equal('Wallet');
    expect(admin.bureau.constructor.name).to.equal('Bureau');
  });
  // }}}

  // Create Token without permission should throw error {{{
  it('Create Token without permission should throw error', async () => {
    const admin = await User.Get(stub);
    expect(admin).exist;
    expect(admin.canCreateNewToken).to.equal(false);
    const createTokenRequest = {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 5,
      amount: 10000,
    };
    try {
      await admin.createNewToken(createTokenRequest);
      throw new Error('Test Fail');
    } catch (e) {
      expect(e.message).to.equal('Current user are not allowed to create new Token');
    }
  });
  // }}}

  // Update User to grant createNewToken permission {{{
  it('Update User to grant createNewToken permission', async () => {
    const admin = await User.Update(stub, 'admin', { canCreateNewToken: true });
    expect(admin).exist;
    expect(admin.canCreateNewToken).to.equal(true);
  });
  // }}}

  // Create Token with wrong options should throw error {{{
  it('Create Token with wrong options should throw error', async () => {
    const admin = await User.Get(stub);
    expect(admin).exist;
    expect(admin.canCreateNewToken).to.equal(true);
    const createTokenRequest = {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 'dummy',
      amount: 10000,
    };
    try {
      await admin.createNewToken(createTokenRequest);
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.have.string('is not a valid CreateTokenOption Object');
    }

    try {
      await admin.createNewToken();
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.have.string('is not a valid CreateTokenOption Object');
    }

    try {
      await admin.createNewToken({ name: 123 });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.have.string('is not a valid CreateTokenOption Object, Missing Required property symbol');
    }

    try {
      await admin.createNewToken({ name: 123, symbol: 'BTC' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.have.string('is not a valid CreateTokenOption Object, Missing Required property decimals');
    }

    try {
      await admin.createNewToken({ name: 123, symbol: 'BTC', decimals: '123' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.have.string('is not a valid CreateTokenOption Object, Missing Required property amount');
    }

    try {
      await admin.createNewToken({
        name: 123, symbol: 'BTC', decimals: '123', amount: '1qwe31',
      });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('Can not parse decimals or amount to a valid number');
    }

    try {
      await admin.createNewToken({
        name: '123', symbol: 'BTC', decimals: '123', amount: '10000',
      });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('123 is not a valid uint4 for CreateTokenOption.decimals');
    }

    try {
      await admin.createNewToken({
        name: '123', symbol: 1111, decimals: '12', amount: '10000',
      });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('1111 is not a valid string for CreateTokenOption.symbol');
    }

    try {
      await admin.createNewToken({
        name: '123', symbol: 'BTC', decimals: '12', amount: -10000,
      });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('-10000 is not a valid Unsigned Int for CreateUserOption.amount');
    }
  });
  // }}}

  // Create Token with correct options should response success {{{
  it('Create Token with correct options should response success', async () => {
    let admin = await User.Get(stub);
    expect(admin).exist;
    expect(admin.canCreateNewToken).to.equal(true);
    const createTokenRequest = {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 5,
      amount: 10000,
    };
    admin = await admin.createNewToken(createTokenRequest);
    const adminObj = admin.toJSON();
    expect(adminObj).exist;
    expect(adminObj.canCreateNewToken).to.equal(false);
    expect(adminObj.wallet).exist;
    expect(adminObj.wallet.Bitcoin).exist;
    expect(adminObj.wallet.Bitcoin.name).to.equal('Bitcoin');
    expect(adminObj.wallet.Bitcoin.symbol).to.equal('BTC');
    expect(adminObj.wallet.Bitcoin.decimals).to.equal(5);
    expect(adminObj.wallet.Bitcoin.amount).to.equal(10000);
    expect(adminObj.wallet.Bitcoin.history).exist;
    expect(adminObj.wallet.Bitcoin.history.length).to.equal(1);
    expect(adminObj.wallet.Bitcoin.history[0].from).to.equal('admin');
    expect(adminObj.wallet.Bitcoin.history[0].to).to.equal('admin');
    expect(adminObj.wallet.Bitcoin.history[0].from).to.equal('admin');
    expect(adminObj.wallet.Bitcoin.history[0].from).to.equal('admin');
  });
  // }}}
  
  it('Create FutureBereau with correct options should response success', async () => {
    let admin = await User.Get(stub);
    expect(admin).exist;
    const createFutureBereauRequest = {
      name: 'aaa',
      creator: 'zhangsan',
      content: 'bbbb',
      endTime: '2018-7-23 10:00',
      option1: 'a1',
      option2: 'b2',
      option3: 'c3',
      judgePerson: 'xyh',
      odds1: 1.1,
      odds2: 1.2,
      odds3: 1.3,
    };
    admin = await admin.createNewFutureBureau(createFutureBereauRequest);
    const adminObj = admin.toJSON();
    expect(adminObj).exist;
    expect(adminObj.bureau).exist;
    expect(adminObj.bureau.aaa).exist;
    expect(adminObj.bureau.aaa.name).to.equal('aaa');
    expect(adminObj.bureau.aaa.creator).to.equal('zhangsan');
    expect(adminObj.bureau.aaa.content).to.equal('bbbb');
    expect(adminObj.bureau.aaa.endTime).to.equal('2018-7-23 10:00');
    expect(adminObj.bureau.aaa.option1).to.equal('a1');
    expect(adminObj.bureau.aaa.option2).to.equal('b2');
    expect(adminObj.bureau.aaa.option3).to.equal('c3');
    expect(adminObj.bureau.aaa.judgePerson).to.equal('xyh');
    expect(adminObj.bureau.aaa.odds1).to.equal(1.1);
    expect(adminObj.bureau.aaa.odds2).to.equal(1.2);
    expect(adminObj.bureau.aaa.odds3).to.equal(1.3);
  });

  // Query Admin Again, it should have BTC in its wallet {{{
  it('Query Admin Again, it should have BTC in its wallet', async () => {
    const admin = await User.Get(stub);
    const adminObj = admin.toJSON();

    expect(adminObj.wallet).exist;
    expect(adminObj.wallet.Bitcoin).exist;
    expect(adminObj.wallet.Bitcoin.name).to.equal('Bitcoin');
    expect(adminObj.wallet.Bitcoin.symbol).to.equal('BTC');
    expect(adminObj.wallet.Bitcoin.decimals).to.equal(5);
    expect(adminObj.wallet.Bitcoin.amount).to.equal(10000);
    expect(adminObj.wallet.Bitcoin.history.length).to.equal(1);
    expect(adminObj.wallet.Bitcoin.history[0].from).to.equal('admin');
    expect(adminObj.wallet.Bitcoin.history[0].to).to.equal('admin');
    expect(adminObj.wallet.Bitcoin.history[0].from).to.equal('admin');
    expect(adminObj.wallet.Bitcoin.history[0].from).to.equal('admin');
  });
  // }}}

  // Create a new User to transfer token to {{{
  it('Create a new User to transfer token to', async () => {
    stub.setUserCtx(cert);

    const user = await User.Create(stub, target);
    expect(user).exist;
    expect(user.id).to.equal(target.id);
    expect(user.name).to.equal(target.name);
    expect(user.role).to.equal(target.role);
    expect(user.wallet.tokens).to.deep.equal({});
    expect(user.canCreateNewToken).to.equal(false);

    stub.cleanUserCtx();
  });
  // }}}

  // Create a User that already exist should throw error {{{
  it('Create a User that already exist should throw error', async () => {
    stub.setUserCtx(cert);
    try {
      await User.Create(stub, target);
    } catch (e) {
      expect(e.message).to.equal('User 9ec73604-0225-4d99-83d7-b858b499e639 already exists');
    }
    stub.cleanUserCtx();
  });
  // }}}

  // Transfer token to dummy target should throw error {{{
  it('Transfer token to dummy target should throw error', async () => {
    const admin = await User.Get(stub);
    try {
      await admin.transfer({
        target: 'dummyUser',
        tokenName: 'Bitcoin',
        amount: '0.00001',
      });
    } catch (e) {
      expect(e.message).to.equal('User dummyUser does not exist');
    }
  });
  // }}}

  // Transfer token with correct options should success {{{
  it('Transfer token with correct options should success', async () => {
    const admin = await User.Get(stub);
    const res = await admin.transfer({
      target: target.id,
      tokenName: 'Bitcoin',
      amount: '0.00001',
    });
    const resp = res.toJSON();

    expect(resp.wallet).exist;
    expect(resp.wallet.Bitcoin).exist;
    expect(resp.wallet.Bitcoin.amount).to.equal(9999.99999);
    expect(resp.wallet.Bitcoin.history).exist;
    expect(resp.wallet.Bitcoin.history.length).to.equal(2);
    expect(resp.wallet.Bitcoin.history[1].from).to.equal('admin');
    expect(resp.wallet.Bitcoin.history[1].to).to.equal(target.id);
    expect(resp.wallet.Bitcoin.history[1].amount).to.equal('0.00001');
  });
  // }}}

  it('BetTransfer tokne with correct options should success', async () => {
    const admin = await User.Get(stub);
    const res = await admin.betTransfer({
      target: target.id,
      futureBureauName: 'aaa',
      chooseOption: 'a1',
      chooseOdds: 1.1,
      tokenName: 'GZH',
      amount: 10,
    });
    const resp = res.toJSON();

    expect(resp.bureau).exist;
    expect(resp.bureau.aaa).exist;
    expect(resp.bureau.aaa.history).exist;
    expect(resp.bureau.aaa.history.length).to.equal(6);
    expect(resp.bureau.aaa.history[1].from).to.equal(target.id);
    expect(resp.bureau.aaa.history[1].to).to.equal('admin');
    expect(resp.bureau.aaa.history[1].chooseOption).to.equal('a1');
    expect(resp.bureau.aaa.history[1].chooseOdds).to.equal(1.1);
    expect(resp.bureau.aaa.history[1].tokenName).to.equal('GZH');
    expect(resp.bureau.aaa.history[1].amount).to.equal(10);
  });

  // Get Target, target should earn token {{{
  it('Get Target, target should earn token', async () => {
    stub.setUserCtx(cert);
    let targetUser = await User.Get(stub);
    targetUser = targetUser.toJSON();

    expect(targetUser).exist;
    expect(targetUser.wallet).exist;
    expect(targetUser.wallet.Bitcoin).exist;
    expect(targetUser.wallet.Bitcoin.amount).to.equal(0.00001);
    expect(targetUser.wallet.Bitcoin.decimals).to.equal(5);
    expect(targetUser.wallet.Bitcoin.history).exist;
    expect(targetUser.wallet.Bitcoin.history.length).to.equal(1);
    stub.cleanUserCtx();
  });
  // }}}

  // Target User transfer an amount larger than his wallet balance should throw error {{{
  it('Target User transfer an amount larger than his wallet balance should throw error', async () => {
    stub.setUserCtx(cert);
    const targetUser = await User.Get(stub, target.id);
    try {
      await targetUser.transfer({
        target: target.id,
        tokenName: 'Bitcoin',
        amount: '1',
      });
    } catch (e) {
      expect(e.message).to.equal('Do not have enough token');
    }
    stub.cleanUserCtx();
  });
  // }}}

  // Target User transfer a token does not exists in his wallet should throw error {{{
  it('Target User transfer a token does not exists in his wallet should throw error', async () => {
    stub.setUserCtx(cert);
    const targetUser = await User.Get(stub, target.id);
    try {
      await targetUser.transfer({
        target: target.id,
        tokenName: 'Eth',
        amount: '1',
      });
    } catch (e) {
      expect(e.message).to.equal('expend - There is not enough token Eth in wallet');
    }
    stub.cleanUserCtx();
  });
  // }}}

  // Non-admin user can not call Update {{{
  it('Non-admin user can not call Update', async () => {
    stub.setUserCtx(cert);
    try {
      await User.Update(stub, target.id, { role: 'admin' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('Only admin can update user info, current user is "user"');
    }
    stub.cleanUserCtx();
  });
  // }}}

  // Update a user that does not exist should throw error {{{
  it('Update a user that does not exist should throw error', async () => {
    try {
      await User.Update(stub, 'dummyUser', { role: 'admin' });
      throw new Error('Test Failed');
    } catch (e) {
      expect(e.message).to.equal('User dummyUser does not exist');
    }
  });
  // }}}

  // Admin can update a User to grant admin permission {{{
  it('Admin can update a User to grant admin permission', async () => {
    const newAdmin = await User.Update(stub, target.id, { role: 'admin' });
    expect(newAdmin).exist;
    expect(newAdmin.role).to.equal('admin');
  });
  // }}}
});
