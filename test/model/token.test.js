const MockStub = require('../mock-stub.js');
const Token = require('../../lib/model/token');

const stub = new MockStub();

describe('Test Token', () => {
  it('Create a new Token', async () => {
    let token = new Token();
    await token.create({
      name: 'aaa',
      symbol: 'AAA',
    }, stub);
  });

  it('Query for the amout of Token', async () => {
    
  });
});
