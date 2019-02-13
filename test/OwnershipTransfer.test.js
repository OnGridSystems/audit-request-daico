const { assertRevert } = require('./helpers/assertRevert');

const Claimable = artifacts.require('Claimable');
const ProxyClaimable = artifacts.require('ProxyClaimable');
const ProxyTransferable = artifacts.require('Test');

contract('ProxyContracts', function (accounts) {
  let claimable;
  let proxyClaimable;
  let proxyTransferable;

  beforeEach(async function () {
    claimable = await Claimable.new();
    proxyClaimable = await ProxyClaimable.new();
    proxyTransferable = await ProxyTransferable.new();
  });

  it('Transfer ownership', async function () {
    let owner = await claimable.owner.call();
    const newOwner = proxyClaimable.address;
    assert.notEqual(owner, newOwner);
    await claimable.transferOwnership(newOwner);
    await proxyClaimable.proxyClaimOwnership(claimable.address);
    owner = await claimable.owner.call();
    assert.equal(owner, newOwner);
  });

  describe('Multiple transfer between a, b and c', function () {
    beforeEach(async function () {
      this.a = proxyTransferable;
      this.b = proxyClaimable;
      this.c = claimable;
    });

    it('Transfer ownership of c to a', async function () {
      let owner = await this.c.owner.call();
      assert.notEqual(this.a.address, owner);
      await this.c.transferOwnership(this.a.address);
      await this.a.proxyClaimOwnership(this.c.address);
      owner = await this.c.owner.call();
      assert.equal(this.a.address, owner);
    });

    describe('After transfer ownership of c to a', async function () {
      beforeEach(async function () {
        await this.c.transferOwnership(this.a.address);
        await this.a.proxyClaimOwnership(this.c.address);
      });

      it('Transfer ownership c to b', async function () {
        await this.a.proxyTransferOwnership(this.c.address, this.b.address);
        await this.b.proxyClaimOwnership(this.c.address);
        const owner = await this.c.owner.call();
        assert.equal(this.b.address, owner);
      });

      describe('After transfer ownership of c to b', async function () {
        beforeEach(async function () {
          await this.a.proxyTransferOwnership(this.c.address, this.b.address);
          await this.b.proxyClaimOwnership(this.c.address);
        });

        it('a cannot transfer ownership of c to anyone', async function () {
          await assertRevert(this.a.proxyTransferOwnership(this.c.address, this.a.address));
        });
      });
    });
  });

  describe('Test owner check', async function () {
    it('Owner can call proxyClaimOwnership', async function () {
      await claimable.transferOwnership(proxyClaimable.address);
      const owner = await proxyClaimable.owner.call();
      await proxyClaimable.proxyClaimOwnership(claimable.address, { from: owner });
    });

    it('Other accounts can not call proxyClaimOwnership', async function () {
      await claimable.transferOwnership(proxyClaimable.address);
      const owner = await proxyClaimable.owner();
      const otherAccount = accounts[5];
      assert.notEqual(owner, otherAccount);
      await assertRevert(proxyClaimable.proxyClaimOwnership(claimable.address, { from: otherAccount }));
    });

    it('Owner can call proxyTransferOwnership', async function () {
      await claimable.transferOwnership(proxyTransferable.address);
      await proxyTransferable.proxyClaimOwnership(claimable.address);
      await proxyTransferable.proxyTransferOwnership(claimable.address, proxyClaimable.address);
    });

    it('Other accounts can not call proxyTransferOwnership', async function () {
      await claimable.transferOwnership(proxyTransferable.address);
      await proxyTransferable.proxyClaimOwnership(claimable.address);

      const owner = await proxyTransferable.owner();
      const otherAccount = accounts[5];
      assert.notEqual(owner, otherAccount);
      await assertRevert(proxyTransferable.proxyTransferOwnership(
        claimable.address, proxyClaimable.address, { from: otherAccount }));
    });
  });
});
