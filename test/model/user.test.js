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
      role: 'admin',
    };
    const user = await User.Create(stub, opts);

    expect(user).exist;
    expect(user.id).to.equal(opts.id);
    expect(user.name).to.equal(opts.name);
    expect(user.role).to.equal(opts.role);
    expect(user.wallet.tokens).to.deep.equal({});
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

  it('Test exists', async () => {
    let res = await User.Exists(stub, 'admin');
    expect(res).to.equal(true);
    res = await User.Exists(stub, 'dummy');
    expect(res).to.equal(false);
  });

  it('Get user by the common name of the certificate should success', async () => {
    let admin = await User.Get(stub);
    expect(admin).exist;
    expect(admin.id).to.equal('admin');
    expect(admin.name).to.equal('zhangsan');
    expect(admin.role).to.equal('admin');
    expect(admin.canCreateNewToken).to.equal(false);
    expect(admin.wallet).exist;
    expect(admin.wallet.tokens).to.deep.equal({});
    expect(admin.constructor.name).to.equal('User');

    let resp = admin.toString();
    resp = JSON.parse(resp);
    expect(resp).exist;
    expect(resp.id).to.equal('admin');
    expect(resp.name).to.equal('zhangsan');
    expect(resp.role).to.equal('admin');
    expect(resp.canCreateNewToken).to.equal(false);
    expect(resp.wallet).to.deep.equal({});

    admin = User.FROM_JSON(stub, resp);
    expect(admin).exist;
    expect(admin.id).to.equal('admin');
    expect(admin.name).to.equal('zhangsan');
    expect(admin.role).to.equal('admin');
    expect(admin.canCreateNewToken).to.equal(false);
    expect(admin.wallet).exist;
    expect(admin.wallet.tokens).to.deep.equal({});
    expect(admin.constructor.name).to.equal('User');
    expect(admin.wallet.constructor.name).to.equal('Wallet');
  });

  it('Update User to grant createNewToken permission', async () => {
    const admin = await User.Update(stub, 'admin', { canCreateNewToken: true });
    expect(admin).exist;
    expect(admin.canCreateNewToken).to.equal(true);
  });

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
  });
});
