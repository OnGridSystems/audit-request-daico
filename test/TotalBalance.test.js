const Organization = artifacts.require('Organization');
const MainToken = artifacts.require('ProjectToken');
const Fund = artifacts.require('Fund');
const StableCoin = artifacts.require('StableCoin');

contract('getTotalBalance', function (accounts) {
  const stableCoinHolder = accounts[9];
  const initialSupply = 100;
  const owner = accounts[0];
  let stableCoin1;
  const decimal1 = 18;
  let stableCoin2;
  const decimal2 = 2;
  let stableCoin3;
  const decimal3 = 18;
  let stableCoin4;
  const decimal4 = 6;
  let stableCoin5;
  const decimal5 = 6;
  let stableCoin6;
  const decimal6 = 18;
  let organisation;
  let maintoken;
  let fund;

  beforeEach(async function () {
    stableCoin1 = await StableCoin.new(stableCoinHolder, initialSupply, 'DAI');
    await stableCoin1.setDecimals(decimal1);
    stableCoin2 = await StableCoin.new(stableCoinHolder, initialSupply, 'GUSD');
    await stableCoin2.setDecimals(decimal2);
    stableCoin3 = await StableCoin.new(stableCoinHolder, initialSupply, 'PAX');
    await stableCoin3.setDecimals(decimal3);
    stableCoin4 = await StableCoin.new(stableCoinHolder, initialSupply, 'USDC');
    await stableCoin4.setDecimals(decimal4);
    stableCoin5 = await StableCoin.new(stableCoinHolder, initialSupply, 'USDT');
    await stableCoin5.setDecimals(decimal5);
    stableCoin6 = await StableCoin.new(stableCoinHolder, initialSupply, 'TUSD');
    await stableCoin6.setDecimals(decimal6);

    maintoken = await MainToken.new();
    organisation = await Organization.new('TestOrganisation', maintoken.address, owner);
    fund = await Fund.new(organisation.address, 'Fund');
    await organisation.addStableCoin(stableCoin1.address);
    await organisation.addStableCoin(stableCoin2.address);
    await organisation.addStableCoin(stableCoin3.address);
    await organisation.addStableCoin(stableCoin4.address);
    await organisation.addStableCoin(stableCoin5.address);
    await organisation.addStableCoin(stableCoin6.address);
  });

  describe('Add 100$ to Fund balance on one of StableCoins', async function () {
    beforeEach(async function () {
      await stableCoin1.mint(fund.address, (100 * (10 ** decimal1)).toString());
    });

    it('Fund Stable coins balance equal to 100$ (100*10**18 atto)', async function () {
      const balance = await fund.getTotalAmountInAtto.call();
      assert.equal(balance, 100 * 10 ** 18);
    });

    it('Burn 1$ from Fund Stable coins, balance equal to 99$ (99*10**18 atto)', async function () {
      const balance = await fund.getTotalAmountInAtto.call();
      assert.equal(balance, 100 * 10 ** 18);
    });
  });

  describe('Add 6 stable coins to Fund 100$ each', async function () {
    beforeEach(async function () {
      await stableCoin1.mint(fund.address, (100 * (10 ** decimal1)).toString());
      await stableCoin2.mint(fund.address, (100 * (10 ** decimal2)).toString());
      await stableCoin3.mint(fund.address, (100 * (10 ** decimal3)).toString());
      await stableCoin4.mint(fund.address, (100 * (10 ** decimal4)).toString());
      await stableCoin5.mint(fund.address, (100 * (10 ** decimal5)).toString());
      await stableCoin6.mint(fund.address, (100 * (10 ** decimal6)).toString());
    });

    it('Fund Stable coins balance equal to 600$ (600*10**18 atto)', async function () {
      const balance = await fund.getTotalAmountInAtto.call();
      assert.equal(balance, 600 * 10 ** 18);
    });

    it('Burn 50$ from one StableCoin Fund balance, balance equal to 550$ (550*10**18 atto)', async function () {
      await stableCoin1.burn(fund.address, (50 * (10 ** decimal1)).toString());
      const balance = await fund.getTotalAmountInAtto.call();
      assert.equal(balance, 550 * 10 ** 18);
    });

    it('Burn 50$ from each StableCoin Fund balance, balance equal to 300$ (300*10**18 atto)', async function () {
      await stableCoin1.burn(fund.address, (50 * (10 ** decimal1)).toString());
      await stableCoin2.burn(fund.address, (50 * (10 ** decimal2)).toString());
      await stableCoin3.burn(fund.address, (50 * (10 ** decimal3)).toString());
      await stableCoin4.burn(fund.address, (50 * (10 ** decimal4)).toString());
      await stableCoin5.burn(fund.address, (50 * (10 ** decimal5)).toString());
      await stableCoin6.burn(fund.address, (50 * (10 ** decimal6)).toString());
      const balance = await fund.getTotalAmountInAtto.call();
      assert.equal(balance, 300 * 10 ** 18);
    });

    it('Delete StableCoin1, Fund balance equal to 300$ (500*10**18 atto)', async function () {
      await organisation.delStableCoin(stableCoin1.address);
      const balance = await fund.getTotalAmountInAtto.call();
      assert.equal(balance, 500 * 10 ** 18);
    });

    it('Delete any three StableCoins, Fund balance equal to 300$ (300*10**18 atto)', async function () {
      await organisation.delStableCoin(stableCoin1.address);
      await organisation.delStableCoin(stableCoin2.address);
      await organisation.delStableCoin(stableCoin3.address);
      const balance = await fund.getTotalAmountInAtto.call();
      assert.equal(balance, 300 * 10 ** 18);
    });
  });
});
