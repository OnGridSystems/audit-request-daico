const { assertRevert } = require('./helpers/assertRevert');

const A = artifacts.require('A');
const B = artifacts.require('B');
const Token = artifacts.require('ProjectToken');

contract('ProxyMinting', function (accounts) {
  let a;
  let b;
  let token;

  beforeEach(async function () {
    token = await Token.new();
    a = await A.new(token.address);
    b = await B.new(token.address, a.address);
    await token.transferOwnership(a.address);
    await a.proxyClaimOwnership(token.address);
  });

  it('A owner of Token', async function () {
    const owner = await token.owner();
    assert.equal(owner, a.address);
  });

  it('A can mint tokens without limit', async function () {
    await a.proxyMint(accounts[5], 2000);
    await a.proxyMint(accounts[5], 20000);
    await a.proxyMint(accounts[5], 200000);
    const balance = await token.balanceOf(accounts[5]);
    assert.equal(balance, 222000);
  });

  it('B can not mint tokens yet', async function () {
    await assertRevert(b.proxyMint(accounts[5], 2000));
  });

  describe('A transfer token ownership to B', async function () {
    beforeEach(async function () {
      await a.proxyTransferOwnership(token.address, b.address);
      await b.proxyClaimOwnership(token.address);
    });

    it('B now owns Token', async function () {
      const owner = await token.owner();
      assert.equal(owner, b.address);
    });

    it('B can mint tokens', async function () {
      await b.proxyMint(accounts[5], 1);
      const balance = await token.balanceOf(accounts[5]);
      assert.equal(balance, 1);
    });

    it('B can not return token to owner while minting not over', async function () {
      await assertRevert(b.returnTokenToOriginalOwner());
    });

    describe('B mint more tokens till cap', async function () {
      beforeEach(async function () {
        await b.proxyMint(accounts[5], 2);
      });

      it('B mint more tokens', async function () {
        const balance = await token.balanceOf(accounts[5]);
        assert.equal(balance, 2);
      });

      it('B cant mint more tokens', async function () {
        await assertRevert(b.proxyMint(accounts[5], 2));
      });

      describe('B return ownership to A', async function () {
        beforeEach(async function () {
          await b.returnTokenToOriginalOwner();
        });

        it('A can claim token', async function () {
          const pendingOwner = await token.pendingOwner();
          assert.equal(pendingOwner, a.address);
          await a.proxyClaimOwnership(token.address);
        });

        it('A owns token', async function () {
          await a.proxyClaimOwnership(token.address);
          const owner = await token.owner();
          assert.equal(owner, a.address);
        });

        it('A can mint tokens', async function () {
          await a.proxyClaimOwnership(token.address);
          await a.proxyMint(accounts[5], 1);
          const balance = await token.balanceOf(accounts[5]);
          assert.equal(balance, 3);
        });
      });
    });
  });
});
