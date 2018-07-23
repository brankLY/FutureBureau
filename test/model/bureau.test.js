/* eslint-disable no-unused-expressions */
const Stub = require('../mock-stub');
const { expect } = require('chai');

const stub = new Stub();

const Bureau = require('../../lib/model/Bureau');

describe('Test Bureau', () => {
  before(async () => {
    await stub.reset();
  });

  it('NEW_EMPTY_BUREAU should response an empty array exists', () => {
    const res = Bureau.NEW_EMPTY_WALLET(stub);
    expect(res).exist;
    expect(res.futureBureaus).to.deep.equal({});
    expect(res.stub).exist;
  });
})