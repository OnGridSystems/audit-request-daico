// const { assertRevert, shouldFail } = require('./helpers/assertRevert');
const { BN } = require('openzeppelin-test-helpers');

const Fund = artifacts.require('Fund');
const Organization = artifacts.require('Organization');
const StableCoin = artifacts.require('StableCoin');
const Token = artifacts.require('ProjectToken');
const Gov = artifacts.require('Governance'); // ToDo change to Governance after impl
const CS = artifacts.require('CrowdSale');
const ContributorRelay = artifacts.require('ContributorRelay');

contract('ContributorRelay isolated', function (accounts) {
  const contributorAcct = accounts[1];
  describe('with contracts stack', async function () {
    let cr, dai;
    beforeEach(async function () {
      cr = await ContributorRelay.new(contributorAcct);
      dai = await StableCoin.new(cr.address, new BN('1000'), 'DAI');
    });

    it('ContributorRelay vars', async function () {
      await cr.contributorAcct();
      await cr.crowdSaleCtct();
    });

    it('check ContributorRelay functions', async function () {
      await cr.returnStcToContributor(dai.address, new BN('1000'), { from: contributorAcct });
    });
  });
});

contract('CrowdSale full behavior', function (accounts) {
  const webPlatformAcct = accounts[1];
  const admin = accounts[0];
  const contributorAcct = accounts[2];
  describe('with contracts stack', async function () {
    let dai, fund, token, org, cs, gov;
    beforeEach(async function () {
      token = await Token.new();
      org = await Organization.new('TestOrganisation', token.address, admin);
      fund = await Fund.new(org.address, 'TestFund');
      // ToDo the first arg of tap should be spender = gov
      gov = await Gov.new(fund.address, token.address); // ToDo change after Gov refactoring
      dai = await StableCoin.new(contributorAcct, new BN('1000000'), 'DAI');
      await dai.setDecimals(18);
      await org.addStableCoin(dai.address);
      cs = await CS.new(org.address, gov.address, fund.address, webPlatformAcct);
    });

    it('Lock', async function () {
      await gov.transferOwnership(cs.address);
      let pending = await gov.pendingOwner();
      assert(pending, cs.address);
      await cs.proxyClaimOwnership(gov.address);
      pending = await gov.pendingOwner();
      assert(pending, 0);
      let owner = await gov.owner();
      assert(owner, cs.address);
      await cs.transferOwnership(gov.address);
      pending = await cs.pendingOwner();
      assert(pending, gov.address);
      await gov.proxyClaimOwnership(cs.address);
      owner = await cs.owner();
      assert(owner, gov.address);
    });
  });
});
