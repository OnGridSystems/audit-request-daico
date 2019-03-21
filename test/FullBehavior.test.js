const { should } = require('openzeppelin-test-helpers');
const { assertRevert } = require('./helpers/assertRevert');

const Tap = artifacts.require('Tap');
const Org = artifacts.require('Organization');
const Fund = artifacts.require('Fund');
const ZERO = '0x0000000000000000000000000000000000000000';

contract('FullBehaviorTest', function ([_, deployer, owner, newOwner, newestOwner, token]) {
  beforeEach(async function () {
    this.org = await Org.new('Registry', token, owner);
    this.fund = await Fund.new(this.org.address, 'Fund');
    this.tap = await Tap.new(owner, this.fund.address, 1, 'Tap');
  });
  it('should create crowdsale with correct parameters', async function () {
    should.exist(this.org);
    should.exist(this.fund);
    should.exist(this.tap);
  });
  it('returns correct owner and pendingOwner', async function () {
    (await this.org.owner()).should.be.equal(owner);
    (await this.org.pendingOwner()).should.be.equal(ZERO);
  });
  it('Only pendingOwner can claim ownership', async function () {
    await assertRevert(this.org.claimOwnership({ from: newOwner }));
  });
  describe('After claimed ownership', function () {
    beforeEach(async function () {
      await this.org.transferOwnership(newOwner, { from: owner });
      await this.org.claimOwnership({ from: newOwner });
    });
    it('returns correct owner', async function () {
      (await this.org.owner()).should.be.equal(newOwner);
      (await this.org.pendingOwner()).should.be.equal(ZERO);
    });
    it('Only owner can transfer ownership', async function () {
      await assertRevert(this.org.transferOwnership(newestOwner, { from: newestOwner }));
    });
    describe('After transferred ownership to newestOwner', function () {
      beforeEach(async function () {
        await this.org.transferOwnership(newestOwner, { from: newOwner });
      });
      it('returns correct owner', async function () {
        (await this.org.owner()).should.be.equal(newOwner);
        (await this.org.pendingOwner()).should.be.equal(newestOwner);
      });
      describe('After claimed ownership by newestOwner', function () {
        beforeEach(async function () {
          await this.org.claimOwnership({ from: newestOwner });
        });
        it('returns newestOwner as owner', async function () {
          (await this.org.owner()).should.be.equal(newestOwner);
          (await this.org.pendingOwner()).should.be.equal(ZERO);
        });
      });
    });
  });
});
