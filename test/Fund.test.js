const { assertRevert } = require('./helpers/assertRevert');
const { expectEvent } = require('openzeppelin-test-helpers');

const Tap = artifacts.require('Tap');
const Fund = artifacts.require('Fund');

contract('Fund', function ([_, spender, fakeOrg]) {
  beforeEach(async function () {
    this.fund = await Fund.new(fakeOrg, 'Fund Name');
    this.tap = await Tap.new(spender, this.fund.address, 1, 'Tap');
    this.tap2 = await Tap.new(spender, this.fund.address, 1, 'Tap2');
  });

  it('has an organization', async function () {
    (await this.fund.org()).should.equal(fakeOrg);
  });

  it('has a name', async function () {
    (await this.fund.name()).should.equal('Fund Name');
  });

  it('Fund can add Tap', async function () {
    const { logs } = await this.fund.addTap(this.tap.address);
    expectEvent.inLogs(logs, 'TapAdded');
    assert.isTrue(await this.fund.isTap(this.tap.address));
  });

  it('Fund can delete Tap', async function () {
    await this.fund.addTap(this.tap.address);
    assert.isTrue(await this.fund.isTap(this.tap.address));
    const { logs } = await this.fund.delTap(this.tap.address);
    expectEvent.inLogs(logs, 'TapDeleted');
    assert.isFalse(await this.fund.isTap(this.tap.address));
  });

  it('Fund add two Taps, then delete second', async function () {
    await this.fund.addTap(this.tap.address);
    await this.fund.addTap(this.tap2.address);
    assert.isTrue(await this.fund.isTap(this.tap.address));
    assert.isTrue(await this.fund.isTap(this.tap2.address));
    const { logs } = await this.fund.delTap(this.tap2.address);
    expectEvent.inLogs(logs, 'TapDeleted');
    assert.isFalse(await this.fund.isTap(this.tap2.address));
    assert.isTrue(await this.fund.isTap(this.tap.address));
  });

  it('Cant add same Tap twice', async function () {
    await this.fund.addTap(this.tap.address);
    assert.isTrue(await this.fund.isTap(this.tap.address));
    await assertRevert(this.fund.addTap(this.tap.address));
  });

  it('Cant delete same Tap twice', async function () {
    await this.fund.addTap(this.tap.address);
    assert.isTrue(await this.fund.isTap(this.tap.address));
    await this.fund.delTap(this.tap.address);
    assert.isFalse(await this.fund.isTap(this.tap.address));
    await assertRevert(this.fund.delTap(this.tap.address));
  });
});
