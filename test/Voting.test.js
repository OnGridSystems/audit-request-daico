const { assertRevert } = require('./helpers/assertRevert');
const { expectEvent, time } = require('openzeppelin-test-helpers');
const { getRLP } = require('./helpers/RLP');

const Governance = artifacts.require('Governance');
const MainToken = artifacts.require('ProjectToken');
const Token = artifacts.require('ProjectToken');
const Fund = artifacts.require('FundMock');
const BadToken = artifacts.require('BadToken');

contract('Voting', function (accounts) {
  let pollhash;
  let pollhash2;
  let pollhash3;
  let pollhash4;
  let maintoken;
  let fund;
  let token;
  let poll;
  let newToken;
  let newPoll;
  const holder1 = accounts[1];
  const holder2 = accounts[2];
  const holder3 = accounts[3];
  const holder4 = accounts[4];
  const testHolder = accounts[5];
  const notHolder = accounts[6];
  const emptyAddress = '0x0000000000000000000000000000000000000000';

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
    // register contrubution
    await poll.registerContribution(holder1, maintoken.address, 100, 100);
    await poll.registerContribution(holder2, maintoken.address, 100, 100);
    await poll.registerContribution(holder3, maintoken.address, 100, 100);
    await poll.registerContribution(holder4, maintoken.address, 100, 100);
    await poll.makeVotable();

    this.openingTime = (await time.latest()).add(time.duration.days(1));
    this.inProgress = this.openingTime.add(time.duration.days(1));
    this.closingTime = this.inProgress.add(time.duration.days(1));
    this.afterClosingTime = this.closingTime.add(time.duration.days(1));
  });

  describe('Mint 100 tokens to testHolder', async function () {
    beforeEach(async function () {
      const { logs } = await poll.newPoll(
        token.address, getRLP('mint(address,uint256)', testHolder, 100), this.openingTime, this.closingTime,
        { from: holder1 });
      pollhash = logs[0].args.pollHash;
      expectEvent.inLogs(logs, 'PollStarted');
      await time.increaseTo(this.inProgress);
    });

    it('Vote failed, no quorum', async function () {
      await poll.vote(pollhash, true, { from: holder1 });
      await time.increaseTo(this.afterClosingTime);
      await poll.tryToFinalize(pollhash, { from: holder1 });
      const balance = await token.balanceOf(testHolder);
      assert.equal(balance, 0);
    });

    it('Vote successful, negative result', async function () {
      await poll.vote(pollhash, false, { from: holder1 });
      await poll.vote(pollhash, false, { from: holder2 });
      await time.increaseTo(this.afterClosingTime);
      await poll.tryToFinalize(pollhash, { from: holder1 });
      const balance = await token.balanceOf(testHolder);
      assert.equal(balance, 0);
    });

    it('Vote successful, positive result', async function () {
      await poll.vote(pollhash, true, { from: holder1 });
      await poll.vote(pollhash, true, { from: holder2 });
      await poll.vote(pollhash, true, { from: holder3 });
      await time.increaseTo(this.afterClosingTime);
      await poll.tryToFinalize(pollhash, { from: holder1 });
      const balance = await token.balanceOf(testHolder);
      assert.equal(balance, 100);
    });

    it('Vote failed, equal results, no majority', async function () {
      await poll.vote(pollhash, true, { from: holder1 });
      await poll.vote(pollhash, true, { from: holder2 });
      await poll.vote(pollhash, false, { from: holder3 });
      await poll.vote(pollhash, false, { from: holder4 });
      await time.increaseTo(this.afterClosingTime);
      await poll.tryToFinalize(pollhash, { from: holder4 });
      const balance = await token.balanceOf(testHolder);
      assert.equal(balance, 0);
    });

    it('Vote failed, got positive majority, but one holder revoke his vote, no quorum', async function () {
      await poll.vote(pollhash, true, { from: holder1 });
      await poll.vote(pollhash, true, { from: holder2 });
      await poll.revokeVote(pollhash, { from: holder2 });
      await time.increaseTo(this.afterClosingTime);
      await poll.tryToFinalize(pollhash, { from: holder4 });
      const balance = await token.balanceOf(testHolder);
      assert.equal(balance, 0);
    });

    it('Vote successful, got negative majority, but two holders revoke votes and re vote positive', async function () {
      await poll.vote(pollhash, true, { from: holder1 });
      await poll.vote(pollhash, false, { from: holder2 });
      await poll.vote(pollhash, false, { from: holder3 });
      await poll.vote(pollhash, false, { from: holder4 });
      await poll.revokeVote(pollhash, { from: holder2 });
      await poll.revokeVote(pollhash, { from: holder3 });
      await poll.vote(pollhash, true, { from: holder2 });
      await poll.vote(pollhash, true, { from: holder3 });
      await time.increaseTo(this.afterClosingTime);
      await poll.tryToFinalize(pollhash, { from: holder4 });
      const balance = await token.balanceOf(testHolder);
      assert.equal(balance, 100);
    });
  });

  describe('Poll check', async function () {
    it('Only token holders can create voting', async function () {
      await assertRevert(poll.newPoll(
        token.address, getRLP('mint(address,uint256)', testHolder, 100), this.openingTime, this.closingTime,
        { from: notHolder }));
    });

    it('Cant create new poll if startTime in past', async function () {
      await assertRevert(poll.newPoll(
        token.address, getRLP('mint(address,uint256)', testHolder, 100),
        (await time.latest()).sub(time.duration.hours(1)), this.closingTime, { from: holder1 }));
    });

    it('Cant create new poll with null target address', async function () {
      await assertRevert(
        poll.newPoll(emptyAddress, getRLP('mint(address,uint256)', testHolder, 100), this.openingTime,
          this.closingTime, { from: holder1 }));
    });

    it('Cant create new poll with transaction shorter then minimal signature', async function () {
      await assertRevert(poll.newPoll(token.address, '0x0', this.openingTime, this.closingTime, { from: holder1 }));
    });

    it('Cant create new poll with same transaction and target contract in one block', async function () {
      const target = token.address;
      const transaction = getRLP('mint(address,uint256)', testHolder, 200);
      await poll.newPoll(target, transaction, this.openingTime, this.closingTime, { from: holder1 });
      await assertRevert(poll.newPoll(target, transaction, this.openingTime, this.closingTime, { from: holder1 }));
    });
  });

  describe('Voting check', async function () {
    beforeEach(async function () {
      const { logs } = await poll.newPoll(
        token.address, getRLP('mint(address,uint256)', testHolder, 100), this.openingTime, this.closingTime,
        { from: holder1 });
      pollhash2 = logs[0].args.pollHash;
      expectEvent.inLogs(logs, 'PollStarted');
    });

    it('Cant vote before poll startTime', async function () {
      await assertRevert(poll.vote(pollhash2, true, { from: holder1 }));
    });

    it('Cant vote after poll endTime', async function () {
      await time.increaseTo(this.afterClosingTime);
      await assertRevert(poll.vote(pollhash2, true, { from: holder1 }));
    });

    it('Same person cant vote twice', async function () {
      await time.increaseTo(this.inProgress);
      await poll.vote(pollhash2, true, { from: holder1 });
      await assertRevert(poll.vote(pollhash2, true, { from: holder1 }));
    });

    it('Same person cant revoke vote twice', async function () {
      await time.increaseTo(this.inProgress);
      await poll.vote(pollhash2, true, { from: holder1 });
      await poll.revokeVote(pollhash2, { from: holder1 });
      await assertRevert(poll.revokeVote(pollhash2, { from: holder1 }));
    });

    it('Only token holder can vote', async function () {
      await time.increaseTo(this.inProgress);
      await assertRevert(poll.vote(pollhash2, true, { from: notHolder }));
    });
  });

  describe('Voting check', async function () {
    beforeEach(async function () {
      const { logs } = await poll.newPoll(
        token.address, getRLP('mint(address,uint256)', testHolder, 100), this.openingTime, this.closingTime,
        { from: holder1 });
      pollhash3 = logs[0].args.pollHash;
      expectEvent.inLogs(logs, 'PollStarted');
    });

    it('Cant finalize poll before startTime', async function () {
      assert.isFalse(await poll.tryToFinalize.call(pollhash3, { from: holder1 }));
    });

    it('Cant finalize while poll in progress', async function () {
      await time.increaseTo(this.inProgress);
      assert.isFalse(await poll.tryToFinalize.call(pollhash3, { from: holder1 }));
    });

    it('Can finalize when endTime pass', async function () {
      await time.increaseTo(this.afterClosingTime);
      assert.isTrue(await poll.tryToFinalize.call(pollhash3, { from: holder1 }));
      const { logs } = await poll.tryToFinalize(pollhash3, { from: holder1 });
      expectEvent.inLogs(logs, 'PollFinished');
    });

    it('Cant finalize twice', async function () {
      await time.increaseTo(this.afterClosingTime);
      const { logs } = await poll.tryToFinalize(pollhash3, { from: holder1 });
      expectEvent.inLogs(logs, 'PollFinished');
      await assertRevert(poll.tryToFinalize(pollhash3, { from: holder1 }));
    });
  });

  describe('Fallback revert check', async function () {
    it('invalid transaction', async function () {
      const { logs } = await poll.newPoll(
        token.address, getRLP('mint(address,uint256)', testHolder, 100).replace(4, 5), this.openingTime,
        this.closingTime, { from: holder1 });
      pollhash4 = logs[0].args.pollHash;
      expectEvent.inLogs(logs, 'PollStarted');
      await time.increaseTo(this.inProgress);
      await poll.vote(pollhash4, true, { from: holder1 });
      await poll.vote(pollhash4, true, { from: holder2 });
      await poll.vote(pollhash4, true, { from: holder3 });
      await time.increaseTo(this.afterClosingTime);
      await assertRevert(poll.tryToFinalize(pollhash4, { from: holder1 }));
    });

    it('Fallback revert', async function () {
      const badToken = await BadToken.new();
      const { logs } = await poll.newPoll(
        badToken.address, getRLP('mint(address,uint256)', testHolder, 100), this.openingTime, this.closingTime,
        { from: holder1 });
      pollhash4 = logs[0].args.pollHash;
      expectEvent.inLogs(logs, 'PollStarted');
      await time.increaseTo(this.inProgress);
      await poll.vote(pollhash4, true, { from: holder1 });
      await poll.vote(pollhash4, true, { from: holder2 });
      await poll.vote(pollhash4, true, { from: holder3 });
      await time.increaseTo(this.afterClosingTime);
      await assertRevert(poll.tryToFinalize(pollhash4, { from: holder1 }));
    });
  });
  describe('Ownership check', async function () {
    beforeEach(async function () {
      newToken = await Token.new();
      newPoll = await Governance.new(fund.address, maintoken.address);
      await newToken.transferOwnership(newPoll.address);
    });
    it('Only owner can call proxyClaimOwnership', async function () {
      await assertRevert(newPoll.proxyClaimOwnership(newToken.address, { from: notHolder }));
    });
  });
});
