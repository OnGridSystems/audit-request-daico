const { expectEvent, time } = require('openzeppelin-test-helpers');
const { getRLP } = require('./helpers/RLP');

const Organization = artifacts.require('Organization');
const Governance = artifacts.require('Governance');
const MainToken = artifacts.require('ProjectToken');
const Token = artifacts.require('ProjectToken');
const Fund = artifacts.require('FundMock');

contract('StableCoin Voting', function (accounts) {
  let organisation;
  let stablecoin1;
  let stablecoin2;
  let token;

  let pollhash;
  let pollhash2;
  let pollhash3;
  let maintoken;
  let fund;
  let poll;
  const holder1 = accounts[1];
  const holder2 = accounts[2];
  const holder3 = accounts[3];
  const holder4 = accounts[4];

  before(async function () {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await time.advanceBlock();
  });

  beforeEach(async function () {
    maintoken = await MainToken.new();
    fund = await Fund.new();
    token = await Token.new();
    await fund.setBalance(holder1, 100);
    await fund.setBalance(holder2, 100);
    await fund.setBalance(holder3, 100);
    await fund.setBalance(holder4, 100);
    await maintoken.mint(holder1, 100);
    await maintoken.mint(holder2, 100);
    await maintoken.mint(holder3, 100);
    await maintoken.mint(holder4, 100);
    poll = await Governance.new(fund.address, maintoken.address);
    await token.transferOwnership(poll.address);
    await poll.proxyClaimOwnership(token.address);
    stablecoin1 = await Token.new();
    stablecoin2 = await Token.new();
    organisation = await Organization.new('TestOrganisation', maintoken.address, poll.address);
    this.openingTime = (await time.latest()).add(time.duration.days(1));
    this.inProgress = this.openingTime.add(time.duration.days(1));
    this.closingTime = this.inProgress.add(time.duration.days(1));
    this.afterClosingTime = this.closingTime.add(time.duration.days(1));
  });

  it('Voting for Add StableCoin1, rejected', async function () {
    const { logs } = await poll.newPoll(
      organisation.address, getRLP('addStableCoin(address)', stablecoin1.address), this.openingTime,
      this.closingTime, { from: holder1 });
    expectEvent.inLogs(logs, 'PollStarted');
    pollhash = logs[0].args.pollHash;
    await time.increaseTo(this.inProgress);

    await poll.vote(pollhash, false, { from: holder1 });
    await poll.vote(pollhash, false, { from: holder2 });
    await poll.vote(pollhash, false, { from: holder3 });
    await time.increaseTo(this.afterClosingTime);
    await poll.tryToFinalize(pollhash, { from: holder1 });
    assert.isFalse(await organisation.isStableCoin(stablecoin1.address));
  });

  it('Voting for Add StableCoin1, accepted', async function () {
    const { logs } = await poll.newPoll(
      organisation.address, getRLP('addStableCoin(address)', stablecoin1.address), this.openingTime,
      this.closingTime, { from: holder1 });
    expectEvent.inLogs(logs, 'PollStarted');
    pollhash = logs[0].args.pollHash;
    await time.increaseTo(this.inProgress);
    await poll.vote(pollhash, true, { from: holder1 });
    await poll.vote(pollhash, true, { from: holder2 });
    await poll.vote(pollhash, true, { from: holder3 });
    await time.increaseTo(this.afterClosingTime);
    await poll.tryToFinalize(pollhash, { from: holder1 });
    assert.isTrue(await organisation.isStableCoin(stablecoin1.address));
  });

  it('Voting for Add StableCoin2 accepted, two StableCoins exists', async function () {
    const { logs } = await poll.newPoll(
      organisation.address, getRLP('addStableCoin(address)', stablecoin1.address), this.openingTime,
      this.closingTime, { from: holder1 });
    expectEvent.inLogs(logs, 'PollStarted');
    pollhash = logs[0].args.pollHash;
    await time.increaseTo(this.inProgress);
    await poll.vote(pollhash, true, { from: holder1 });
    await poll.vote(pollhash, true, { from: holder2 });
    await poll.vote(pollhash, true, { from: holder3 });
    await time.increaseTo(this.afterClosingTime);
    await poll.tryToFinalize(pollhash, { from: holder1 });
    assert.isTrue(await organisation.isStableCoin(stablecoin1.address));
    this.openingTime = (await time.latest()).add(time.duration.days(1));
    this.inProgress = this.openingTime.add(time.duration.days(1));
    this.closingTime = this.inProgress.add(time.duration.days(1));
    this.afterClosingTime = this.closingTime.add(time.duration.days(1));

    const tx = await poll.newPoll(
      organisation.address, getRLP('addStableCoin(address)', stablecoin2.address), this.openingTime,
      this.closingTime, { from: holder1 });
    await expectEvent.inTransaction(tx.tx, Governance, 'PollStarted');
    const receipt = await web3.eth.getTransactionReceipt(tx.tx);
    const log = Governance.decodeLogs(receipt.logs);
    pollhash2 = log[0].args.pollHash;
    await time.increaseTo(this.inProgress);
    await poll.vote(pollhash2, true, { from: holder1 });
    await poll.vote(pollhash2, true, { from: holder2 });
    await poll.vote(pollhash2, true, { from: holder3 });
    await time.increaseTo(this.afterClosingTime);
    await poll.tryToFinalize(pollhash2, { from: holder1 });
    assert.isTrue(await organisation.isStableCoin(stablecoin2.address));
  });

  it('Voting for Delete StableCoin1, accepted, only StableCoin2 exists', async function () {
    const { logs } = await poll.newPoll(
      organisation.address, getRLP('addStableCoin(address)', stablecoin1.address), this.openingTime,
      this.closingTime, { from: holder1 });
    expectEvent.inLogs(logs, 'PollStarted');
    pollhash = logs[0].args.pollHash;
    await time.increaseTo(this.inProgress);
    await poll.vote(pollhash, true, { from: holder1 });
    await poll.vote(pollhash, true, { from: holder2 });
    await poll.vote(pollhash, true, { from: holder3 });
    await time.increaseTo(this.afterClosingTime);
    await poll.tryToFinalize(pollhash, { from: holder1 });
    assert.isTrue(await organisation.isStableCoin(stablecoin1.address));
    this.openingTime = (await time.latest()).add(time.duration.days(1));
    this.inProgress = this.openingTime.add(time.duration.days(1));
    this.closingTime = this.inProgress.add(time.duration.days(1));
    this.afterClosingTime = this.closingTime.add(time.duration.days(1));
    let tx = await poll.newPoll(
      organisation.address, getRLP('addStableCoin(address)', stablecoin2.address), this.openingTime,
      this.closingTime, { from: holder1 });
    await expectEvent.inTransaction(tx.tx, Governance, 'PollStarted');
    let receipt = await web3.eth.getTransactionReceipt(tx.tx);
    let log = Governance.decodeLogs(receipt.logs);
    pollhash2 = log[0].args.pollHash;
    await time.increaseTo(this.inProgress);
    await poll.vote(pollhash2, true, { from: holder1 });
    await poll.vote(pollhash2, true, { from: holder2 });
    await poll.vote(pollhash2, true, { from: holder3 });
    await time.increaseTo(this.afterClosingTime);
    await poll.tryToFinalize(pollhash2, { from: holder1 });
    assert.isTrue(await organisation.isStableCoin(stablecoin2.address));
    this.openingTime = (await time.latest()).add(time.duration.days(1));
    this.inProgress = this.openingTime.add(time.duration.days(1));
    this.closingTime = this.inProgress.add(time.duration.days(1));
    this.afterClosingTime = this.closingTime.add(time.duration.days(1));
    tx = await poll.newPoll(
      organisation.address, getRLP('delStableCoin(address)', stablecoin1.address), this.openingTime,
      this.closingTime, { from: holder1 });
    await expectEvent.inTransaction(tx.tx, Governance, 'PollStarted');
    receipt = await web3.eth.getTransactionReceipt(tx.tx);
    log = Governance.decodeLogs(receipt.logs);
    pollhash3 = log[0].args.pollHash;
    await time.increaseTo(this.inProgress);
    await poll.vote(pollhash3, true, { from: holder1 });
    await poll.vote(pollhash3, true, { from: holder2 });
    await poll.vote(pollhash3, true, { from: holder3 });
    await time.increaseTo(this.afterClosingTime);
    await poll.tryToFinalize(pollhash3, { from: holder1 });
    assert.isFalse(await organisation.isStableCoin(stablecoin1.address));
    assert.isTrue(await organisation.isStableCoin(stablecoin2.address));
  });
});
