const { assertRevert } = require('./helpers/assertRevert');

const Governance = artifacts.require('Governance');
const MainToken = artifacts.require('ProjectToken');
const Fund = artifacts.require('FundMock');

contract('registerContribution', function (accounts) {
  let maintoken;
  let fund;
  let gov;
  const investor1 = accounts[1];
  const investor2 = accounts[2];
  const notOwner = accounts[3];
  const stablecoin1 = accounts[8];
  const stablecoin2 = accounts[9];
  const stc1 = 100;
  const tokens1 = 1000;
  const stc2 = 300;
  const tokens2 = 3000;
  const stc3 = 5000;
  const tokens3 = 100;

  beforeEach(async function () {
    maintoken = await MainToken.new();
    fund = await Fund.new();
    gov = await Governance.new(fund.address, maintoken.address);
  });

  describe('Owner check', async function () {
    it('Only owner can call registerContribution', async function () {
      await assertRevert(gov.registerContribution(investor1, stablecoin1, stc1, tokens1, { from: notOwner }));
    });
  });

  describe('Process payment', async function () {
    it('Investor1 contribute 100 stableCoin1 and 1000 tokens', async function () {
      await gov.registerContribution(investor1, stablecoin1, stc1, tokens1);
      assert.equal(await gov.voterBalance(investor1), tokens1);
      const amounts = await gov.contributions(investor1, stablecoin1);
      assert.equal(amounts.stableCoinAmount, stc1);
      assert.equal(amounts.tokenAmount, tokens1);
    });
    describe('Process payment2', async function () {
      beforeEach(async function () {
        await gov.registerContribution(investor1, stablecoin1, stc1, tokens1);
      });

      it('Investor1 adds 300 stableCoin2 and 3000 tokens', async function () {
        await gov.registerContribution(investor1, stablecoin2, stc2, tokens2);
        assert.equal(await gov.voterBalance(investor1), tokens1 + tokens2);
        const amounts = await gov.contributions(investor1, stablecoin2);
        assert.equal(amounts.stableCoinAmount, stc2);
        assert.equal(amounts.tokenAmount, tokens2);
      });
    });
  });

  describe('Process payment3', async function () {
    it('Investor2 contribute 5000 stableCoin1 and 100 tokens', async function () {
      await gov.registerContribution(investor2, stablecoin1, stc3, tokens3);
      assert.equal(await gov.voterBalance(investor2), tokens3);
      const amounts = await gov.contributions(investor2, stablecoin1);
      assert.equal(amounts.stableCoinAmount, stc3);
      assert.equal(amounts.tokenAmount, tokens3);
    });
  });
});
