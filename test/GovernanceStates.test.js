const { assertRevert } = require('./helpers/assertRevert');
const { expectEvent, time, BN } = require('openzeppelin-test-helpers');
const { getRLP } = require('./helpers/RLP');

const Organization = artifacts.require('Organization');
const Governance = artifacts.require('Governance');
const BadToken = artifacts.require('BadStableCoin');
const Token = artifacts.require('ProjectToken');
const Fund = artifacts.require('Fund');

contract('Governance States', function (accounts) {
  let token;
  let organization;
  let fund;
  let governance;
  let stablecoin1;
  let stablecoin2;
  const owner = accounts[0];
  const notOwner = accounts[9];
  const holder1 = accounts[1];
  const holder2 = accounts[2];
  const stablebox = accounts[3];

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    token = await Token.new();
    organization = await Organization.new('TestOrganisation', token.address, owner);
    fund = await Fund.new(organization.address, 'TestFund');
    governance = await Governance.new(fund.address, token.address);
    stablecoin1 = await Token.new();
    stablecoin2 = await Token.new();
    await organization.addStableCoin(stablecoin1.address);
    await organization.addStableCoin(stablecoin2.address);
    await stablecoin1.mint(fund.address, 100);
    await stablecoin2.mint(fund.address, 100);
    await token.mint(governance.address, 100);
    await governance.registerContribution(holder1, stablecoin1.address, 100, 100);
    await token.mint(governance.address, 100);
    await governance.registerContribution(holder2, stablecoin1.address, 100, 100);
    this.openingTime = (await time.latest()).add(time.duration.days(1));
    this.inProgress = this.openingTime.add(time.duration.days(1));
    this.closingTime = this.inProgress.add(time.duration.days(1));
    this.afterClosingTime = this.closingTime.add(time.duration.days(1));
  });

  it('Only owner can switch state to Votable', async function () {
    await assertRevert(governance.makeVotable({ from: notOwner }));
    await governance.makeVotable({ from: owner });
  });

  it('Only owner can switch state to Refunding', async function () {
    await assertRevert(governance.startRefunding({ from: notOwner }));
    await governance.startRefunding({ from: owner });
  });

  it('Cant switch to Refunding state from Votable state', async function () {
    await governance.makeVotable({ from: owner });
    await assertRevert(governance.startRefunding({ from: owner }));
  });

  it('Cant switch to Votable state from Refunding state', async function () {
    await governance.startRefunding({ from: owner });
    await assertRevert(governance.makeVotable({ from: owner }));
  });

  it('Cant create voting when in Waiting state', async function () {
    await assertRevert(governance.newPoll(
      organization.address, getRLP('addStableCoin(address)', stablecoin2.address), this.openingTime,
      this.closingTime, { from: holder1 }));
  });

  it('Cant create voting when in Refunding state', async function () {
    await governance.startRefunding();
    await assertRevert(governance.newPoll(
      organization.address, getRLP('addStableCoin(address)', stablecoin2.address), this.openingTime,
      this.closingTime, { from: holder1 }));
  });

  it('Can create voting when in Votable state', async function () {
    await governance.makeVotable();
    const { logs } = await governance.newPoll(
      organization.address, getRLP('addStableCoin(address)', stablecoin2.address), this.openingTime,
      this.closingTime, { from: holder1 });
    expectEvent.inLogs(logs, 'PollStarted');
  });

  it('Cant withdraw tokens when in Waiting state', async function () {
    await assertRevert(
      governance.withdrawToken(holder1, 50, { from: holder1 })
    );
  });

  it('Cant withdraw tokens when in Refunding state', async function () {
    await assertRevert(
      governance.withdrawToken(holder1, 50, { from: holder1 })
    );
  });

  it('Can withdraw tokens when in Votable state', async function () {
    await governance.makeVotable();
    await governance.withdrawToken(holder1, 50, { from: holder1 });
    const balance = await token.balanceOf(holder1);
    assert.equal(balance, 50);
  });

  it('Withdraw tokens in Votable state to other account', async function () {
    (await token.balanceOf(stablebox)).should.be.bignumber.equal(new BN('0'));
    await governance.makeVotable();
    await governance.withdrawToken(stablebox, 50, { from: holder1 });
    (await token.balanceOf(stablebox)).should.be.bignumber.equal(new BN('50'));
  });

  it('Cant exceeds your virtual balance when withdraw', async function () {
    await governance.makeVotable();
    await assertRevert(
      governance.withdrawToken(holder1, 101, { from: holder1 })
    );
  });

  it('Cant refund your StableCoins when in Waiting state', async function () {
    await fund.addTap(governance.address);
    await assertRevert(governance.refundContribution(stablecoin1.address, { from: holder1 }));
  });

  it('Cant refund your StableCoins when in Votable state', async function () {
    await governance.makeVotable();
    await fund.addTap(governance.address);
    await assertRevert(governance.refundContribution(stablecoin1.address, { from: holder1 }));
  });

  it('Can refund your StableCoins when in Refunding state', async function () {
    await governance.startRefunding();
    await fund.addTap(governance.address);
    await governance.refundContribution(stablecoin1.address, { from: holder1 });
  });

  it('Cant refund your StableCoins if no more StableCoins on balance', async function () {
    await governance.startRefunding();
    await fund.addTap(governance.address);
    await governance.refundContribution(stablecoin1.address, { from: holder1 });
    await assertRevert(governance.refundContribution(stablecoin1.address, { from: holder1 }));
  });

  it('Revert if cant withdraw tokens', async function () {
    token = await BadToken.new();
    organization = await Organization.new('TestOrganisation', token.address, owner);
    fund = await Fund.new(organization.address, 'TestFund');
    governance = await Governance.new(fund.address, token.address);
    stablecoin1 = await Token.new();
    await organization.addStableCoin(stablecoin1.address);
    await governance.registerContribution(holder1, stablecoin1.address, 100, 100);
    await governance.makeVotable();
    await assertRevert(
      governance.withdrawToken(holder1, 50, { from: holder1 })
    );
  });

  it('Revert if StableCoin not in list', async function () {
    await governance.startRefunding();
    await fund.addTap(governance.address);
    await organization.delStableCoin(stablecoin1.address);
    await assertRevert(governance.refundContribution(stablecoin1.address, { from: holder1 }));
  });

  it('Revert if StableCoin transfer failed', async function () {
    const stablecoin3 = await BadToken.new();
    await organization.addStableCoin(stablecoin3.address);
    await governance.registerContribution(holder1, stablecoin3.address, 100, 100);
    await governance.startRefunding();
    await fund.addTap(governance.address);
    await assertRevert(governance.refundContribution(stablecoin3.address, { from: holder1 }));
  });
});
