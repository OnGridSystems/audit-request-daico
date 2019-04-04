const { assertRevert } = require('./helpers/assertRevert');
const { BN, constants } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const Tap = artifacts.require('Tap');
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

    it('returnStcToContributor can call only from investor account', async function () {
      await assertRevert(cr.returnStcToContributor(dai.address, new BN('1000')));
    });
  });
});

contract('CrowdSale full behavior', function (accounts) {
  const webPlatformAcct = accounts[1];
  const admin = accounts[0];
  const contributorAcct = accounts[2];
  const newWebPlatformAcct = accounts[3];
  describe('with contracts stack', async function () {
    let dai, fund, token, org, cs, tap, gov;
    beforeEach(async function () {
      token = await Token.new();
      org = await Organization.new('TestOrganisation', token.address, admin);
      fund = await Fund.new(org.address, 'TestFund');
      // ToDo the first arg of tap should be spender = gov
      tap = await Tap.new(ZERO_ADDRESS, fund.address, new BN(0), 'SpendingTap');
      gov = await Gov.new(fund.address, token.address); // ToDo change after Gov refactoring
      dai = await StableCoin.new(contributorAcct, new BN('1000000'), 'DAI');
      await dai.setDecimals(18);
      await org.addStableCoin(dai.address);
      cs = await CS.new(org.address, gov.address, tap.address, fund.address, webPlatformAcct);
      await gov.transferOwnership(cs.address);
      await cs.proxyClaimOwnership(gov.address);
    });

    it('check CrowdSale vars and consts', async function () {
      await cs.SOFTCAP_AUSD();
      await cs.SOFTCAP_DEADLINE();
      await cs.HARDCAP_AUSD();
      await cs.HARDCAP_DEADLINE();
      await cs.MIN_CONTRIB_AUSD();
      await cs.raisedAUsd();
      await cs.softCapReached();
      await cs.running();
      await cs.webPlatformAcct();
      await cs.org();
      await cs.gov();
      await cs.refundTap();
    });

    it('check CrowdSale functions', async function () {
      await cs.newContributorRelay(ZERO_ADDRESS);
      await cs.start();
      await cs.finish();
      await cs.tryToSwitchState();
      await cs.convertStcAmountToAUsd(dai.address, new BN(1000000));
    });
    it('check bonus calculator', async function () {
      const USD = new BN('1000000000000000000');
      (await cs.calculateTokensByAUsdContribution(
        new BN('499999').mul(USD))).should.be.bignumber.equal(
        new BN('499999000000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('500000').mul(USD))).should.be.bignumber.equal(
        new BN('525000000000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('1000001').mul(USD))).should.be.bignumber.equal(
        new BN('1100001100000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('2000001').mul(USD))).should.be.bignumber.equal(
        new BN('2300001150000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('3000001').mul(USD))).should.be.bignumber.equal(
        new BN('3600001200000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('4000001').mul(USD))).should.be.bignumber.equal(
        new BN('5000001250000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('5000001').mul(USD))).should.be.bignumber.equal(
        new BN('6500001300000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('6000001').mul(USD))).should.be.bignumber.equal(
        new BN('8100001350000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('7000001').mul(USD))).should.be.bignumber.equal(
        new BN('9800001400000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('8000001').mul(USD))).should.be.bignumber.equal(
        new BN('11600001450000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('9000001').mul(USD))).should.be.bignumber.equal(
        new BN('13500001500000000000000000'));
      (await cs.calculateTokensByAUsdContribution(
        new BN('10000001').mul(USD))).should.be.bignumber.equal(
        new BN('15000001500000000000000000'));
    });

    describe('with ContributorRelay', async function () {
      let cr;
      beforeEach(async function () {
        const { logs } = await cs.newContributorRelay(contributorAcct);
        const crAddr = logs[0].args.contributorRelay;
        cr = await ContributorRelay.at(crAddr);
      });

      it('check ContributorRelay vars', async function () {
        await cr.contributorAcct();
        await cr.crowdSaleCtct();
      });

      it('processContribution', async function () {
        await dai.transfer(cr.address, new BN('1000000'), { from: contributorAcct });
        await cs.processContribution(cr.address, dai.address, new BN('1000000'), { from: webPlatformAcct });
      });
    });

    describe('processContribution checks', async function () {
      let cr1;
      beforeEach(async function () {
        const { logs } = await cs.newContributorRelay(contributorAcct);
        const crAddr = logs[0].args.contributorRelay;
        cr1 = await ContributorRelay.at(crAddr);
      });
      it('Backend account can call processContribution', async function () {
        await dai.transfer(cr1.address, new BN('1000000'), { from: contributorAcct });
        await cs.processContribution(cr1.address, dai.address, new BN('1000000'), { from: webPlatformAcct });
      });
      it('Investor can call processContribution from his account', async function () {
        await dai.transfer(cr1.address, new BN('1000000'), { from: contributorAcct });
        await cs.processContribution(cr1.address, dai.address, new BN('1000000'), { from: contributorAcct });
      });
      it('Anyone else cant call processContribution', async function () {
        await dai.transfer(cr1.address, new BN('1000000'), { from: contributorAcct });
        await assertRevert(cs.processContribution(cr1.address, dai.address, new BN('1000000'), { from: admin }));
      });
    });

    describe('setWebPlatformAcct checks', async function () {
      it('Owner can call setWebPlatformAcct', async function () {
        let owner = await cs.webPlatformAcct();
        assert(owner, webPlatformAcct);
        await cs.setWebPlatformAcct(newWebPlatformAcct, { from: admin });
        owner = await cs.webPlatformAcct();
        assert(owner, newWebPlatformAcct);
      });
      it('Anyone else cant call setWebPlatformAcct', async function () {
        let owner = await cs.webPlatformAcct();
        assert(owner, webPlatformAcct);
        await assertRevert(cs.setWebPlatformAcct(newWebPlatformAcct, { from: contributorAcct }));
        owner = await cs.webPlatformAcct();
        assert(owner, webPlatformAcct);
      });
    });
  });
});
