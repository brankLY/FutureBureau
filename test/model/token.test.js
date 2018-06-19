/* eslint-disable no-unused-expressions */
const MockStub = require('../mock-stub.js');
const Token = require('../../lib/model/Token');
const { expect } = require('chai');

const stub = new MockStub();

describe('Test Token', () => {
  it('Create a new Token', async () => {
    const options = {
      name: 'aaa',
      symbol: 'AAA',
      decimals: 10,
      amount: 10000,
    };

    const token = await Token.Create(stub, options);
    expect(token.name).to.equal(options.name);
    expect(token.symbol).to.equal(options.symbol);
    expect(token.decimals).to.equal(options.decimals);
    expect(token.amount).to.equal(options.amount);
    expect(token.history).exist;
    expect(token.history.length).to.equal(1);
    expect(token.history[0].amount).to.equal(10000);
    expect(token.history[0].from).to.equal('admin');
    expect(token.history[0].to).to.equal('admin');
    expect(token.history[0].timestamp).exist;
  });

  it('Query for the amout of Token', async () => {

  });
});
