const MockStub = require('../mock-stub.js');
const Token = require('../../lib/model/Token');

const stub = new MockStub();

describe('Test Token', () => {
  it('Create a new Token', async () => {
    let token = new Token(stub);
    await token.create({
      name: 'aaa',
      symbol: 'AAA',
      decimals: 10,
      amount: 10000,
    }, stub);
  });

  it('Query for the amout of Token', async () => {

  });
});
