/* eslint-disable no-unused-expressions */
const Stub = require('../mock-stub');
const { expect } = require('chai');

const stub = new Stub();

const Wallet = require('../../lib/model/Wallet');

describe('Test User', () => {
  before(async () => {
    await stub.reset();
  });

  it('NEW_EMPTY_WALLET should response an empty array exists', () => {
    const res = Wallet.NEW_EMPTY_WALLET(stub);
    expect(res).exist;
    expect(res.tokens).to.deep.equal({});
    expect(res.stub).exist;
  });
});
