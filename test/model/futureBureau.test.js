/* eslint-disable no-unused-expressions */
const MockStub = require('../mock-stub.js');
const FutureBureau = require('../../lib/model/FutureBureau');
const { expect } = require('chai');

const stub = new MockStub();

describe('Test FutureBureau', () => {
  it('Create a new FutureBureau', async () => {
    const options = {
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

    const futureBureau = await FutureBureau.Create(stub, options);
    expect(futureBureau.name).to.equal('aaa');
    expect(futureBureau.creator).to.equal('zhangsan');
    expect(futureBureau.content).to.equal('bbbb');
    expect(futureBureau.endTime).to.equal('2018-7-23 10:00');
    expect(futureBureau.option1).to.equal('a1');
    expect(futureBureau.option2).to.equal('b2');
    expect(futureBureau.option3).to.equal('c3');
    expect(futureBureau.judgePerson).to.equal('xyh');
    expect(futureBureau.odds1).to.equal(1.1);
    expect(futureBureau.odds2).to.equal(1.2);
    expect(futureBureau.odds3).to.equal(1.3);
  });
});
