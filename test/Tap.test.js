const { time } = require('openzeppelin-test-helpers');

const Tap = artifacts.require('Tap');

contract('Tap', function ([_, spender, fund, registry]) {
  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.tap = await Tap.new(registry, fund, spender, 12345678, 'Tap Name');
    this.deployTime = (await time.latest());
  });

  it('has a spender', async function () {
    (await this.tap.spender()).should.equal(spender);
  });

  it('has a bucket', async function () {
    (await this.tap.fund()).should.equal(fund);
  });

  it('has a description', async function () {
    (await this.tap.description()).should.equal('Tap Name');
  });

  it('has a rate', async function () {
    (await this.tap.rate()).should.be.bignumber.equal('12345678');
  });

  it('has a registry', async function () {
    (await this.tap.registry()).should.equal(registry);
  });

  it('has a current lastWithdraw', async function () {
    (await this.tap.lastWithdraw()).should.be.bignumber.equal(this.deployTime);
  });
});
