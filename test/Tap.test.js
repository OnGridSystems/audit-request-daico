const { assertRevert } = require('./helpers/assertRevert');
const { time, BN } = require('openzeppelin-test-helpers');

const Tap = artifacts.require('Tap');
const Fund = artifacts.require('Fund');
const Organization = artifacts.require('Organization');
const StableCoin = artifacts.require('StableCoin');
const BadStableCoin = artifacts.require('BadStableCoin');

function tokensToCents (balance, tokenDecimals) {
  return parseInt(balance / (10 ** (tokenDecimals - 2)));
}

contract('Tap', function (accounts) {
  const rate = new BN(154320987654320); // 400$ per 30 days (40000 cents * (10**16) // (30 * 24 * 60 * 60))
  const dailySpnndCents = 1300; // 400 / 30 ~ 13,33
  const dailyExeeds = 1400; // 14$
  const twoWeeksSpend = 19900; // 199$
  const twoWeeksExeeds = 20000;
  const tapDescription = 'TestTap';
  const tokenMock = accounts[8];
  const spender = accounts[9];
  const notSpender = accounts[2];
  const owner = accounts[0];
  const stableCoinHolder = accounts[3];
  const initialSupply = '100';
  const decimal1 = 18;
  const decimal2 = 2;
  const decimal3 = 6;

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.stableCoin1 = await StableCoin.new(stableCoinHolder, initialSupply, 'DAI');
    await this.stableCoin1.setDecimals(decimal1);
    this.stableCoin2 = await StableCoin.new(stableCoinHolder, initialSupply, 'GUSD');
    await this.stableCoin2.setDecimals(decimal2);
    this.stableCoin3 = await StableCoin.new(stableCoinHolder, initialSupply, 'USDC');
    await this.stableCoin3.setDecimals(decimal3);
    this.organization = await Organization.new('TestOrganisation', tokenMock, owner);
    await this.organization.addStableCoin(this.stableCoin1.address);
    await this.organization.addStableCoin(this.stableCoin2.address);
    await this.organization.addStableCoin(this.stableCoin3.address);
    this.fund = await Fund.new(this.organization.address, 'TestFund');
    await this.stableCoin1.mint(this.fund.address, (500 * (10 ** decimal1)).toString());
    await this.stableCoin2.mint(this.fund.address, (400 * (10 ** decimal2)).toString());
    await this.stableCoin3.mint(this.fund.address, (20 * (10 ** decimal3)).toString());
    this.tap = await Tap.new(spender, this.fund.address, rate, tapDescription);
    await this.fund.addTap(this.tap.address);
    this.deployTime = (await time.latest());
  });

  it('has a spender', async function () {
    (await this.tap.spender()).should.equal(spender);
  });

  it('has a fund', async function () {
    (await this.tap.fund()).should.equal(this.fund.address);
  });

  it('has a description', async function () {
    (await this.tap.description()).should.equal(tapDescription);
  });

  it('has a rate', async function () {
    (await this.tap.rate()).should.be.bignumber.equal(rate);
  });

  it('has a current lastWithdrawTime', async function () {
    (await this.tap.lastWithdrawTime()).should.be.bignumber.equal(this.deployTime);
  });

  it('spender cant withdraw any coins while time not passed', async function () {
    await assertRevert(this.tap.spend(spender, 1, this.stableCoin1.address, { from: spender }));
    await assertRevert(this.tap.spend(spender, 1, this.stableCoin2.address, { from: spender }));
    await assertRevert(this.tap.spend(spender, 1, this.stableCoin3.address, { from: spender }));
  });

  it('only spender can withdraw', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(1)));
    await assertRevert(this.tap.spend(spender, dailySpnndCents, this.stableCoin2.address, { from: notSpender }));
  });

  it('one day pass, spender can withdraw ~ 13$ in StableCoins', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(1)));
    await this.tap.spend(spender, dailySpnndCents, this.stableCoin1.address, { from: spender });
    const spenderBalance = await this.stableCoin1.balanceOf(spender);
    assert.equal(tokensToCents(spenderBalance, decimal1), dailySpnndCents);
  });

  it('one day pass, spender cant withdraw 14$ in any coins', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(1)));
    await assertRevert(this.tap.spend(spender, dailyExeeds, this.stableCoin2.address, { from: spender }));
  });

  it('15 days pass, spender can withdraw ~199$ in StableCoins', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(15)));
    await this.tap.spend(spender, twoWeeksSpend, this.stableCoin2.address, { from: spender });
    const spenderBalance = await this.stableCoin2.balanceOf(spender);
    assert.equal(tokensToCents(spenderBalance, decimal2), twoWeeksSpend);
  });

  it('15 days pass, spender cant withdraw 200$ in StableCoins', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(15)));
    await assertRevert(this.tap.spend(spender, twoWeeksExeeds, this.stableCoin2.address, { from: spender }));
  });

  it('3 days pass, spender can withdraw ~39 in all three StableCoins', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(3)));
    await this.tap.spend(spender, dailySpnndCents, this.stableCoin1.address, { from: spender });
    await this.tap.spend(spender, dailySpnndCents, this.stableCoin2.address, { from: spender });
    await this.tap.spend(spender, dailySpnndCents, this.stableCoin3.address, { from: spender });
    const balance1 = await this.stableCoin1.balanceOf(spender);
    const balance2 = await this.stableCoin2.balanceOf(spender);
    const balance3 = await this.stableCoin3.balanceOf(spender);
    assert.equal(tokensToCents(balance1, decimal1), dailySpnndCents);
    assert.equal(tokensToCents(balance2, decimal2), dailySpnndCents);
    assert.equal(tokensToCents(balance3, decimal3), dailySpnndCents);
  });

  it('3 days pass, spender cant withdraw 1$ from any token not in StableCoin list', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(3)));
    await this.organization.delStableCoin(this.stableCoin1.address);
    await assertRevert(this.tap.spend(spender, dailySpnndCents, this.stableCoin1.address, { from: spender }));
  });

  it('3 days pass, spender cant withdraw 21$ from StableCoin if not enough balance', async function () {
    await time.increaseTo(this.deployTime.add(time.duration.days(3)));
    await assertRevert(this.tap.spend(spender, 2100, this.stableCoin3.address, { from: spender }));
  });

  it('3 days pass, only Tap can call withdrawStableCoin from Fund', async function () {
    await assertRevert(this.fund.withdrawStableCoin(this.stableCoin1.address, spender, 1, { from: spender }));
  });

  it('3 days pass, spender cant withdraw 0,01$, transfer failed', async function () {
    const badStableCoin = await BadStableCoin.new();
    await this.organization.addStableCoin(badStableCoin.address);
    await time.increaseTo(this.deployTime.add(time.duration.days(3)));
    await assertRevert(this.tap.spend(spender, 1, badStableCoin.address, { from: spender }));
  });
});
