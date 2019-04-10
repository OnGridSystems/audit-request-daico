const Tap = artifacts.require('Tap');
const Fund = artifacts.require('Fund');
const Organization = artifacts.require('Organization');
const StableCoin = artifacts.require('StableCoin');
const Token = artifacts.require('ProjectToken');
const Gov = artifacts.require('Governance');
const CS = artifacts.require('CrowdSale');

function development (deployer, network, accounts) {
  const admin = accounts[0];
  const stableCoinHolder = accounts[1];
  const webPlatformAcct = accounts[2];

  return deployer.then(function () {
    return deployer.deploy(Token);
  }).then(function (token) {
    this.token = token;
    return deployer.deploy(Organization, 'TestOrganisation', token.address, admin);
  }).then(function (org) {
    this.org = org;
    return deployer.deploy(Fund, org.address, 'TestFund');
  }).then(function (fund) {
    this.fund = fund;
    return deployer.deploy(Gov, fund.address, Token.address);
  }).then(function (gov) {
    this.gov = gov;
    return deployer.deploy(Tap, this.gov.address, this.fund.address, 154320987654320, 'TestTap');
  }).then(function (tap) {
    this.tap = tap;
    return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'DAI');
  }).then(function (dai) {
    dai.setDecimals(18);
    this.org.addStableCoin(dai.address);
    return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'USDC');
  }).then(function (usdc) {
    usdc.setDecimals(6);
    this.org.addStableCoin(usdc.address);
    return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'USDT');
  }).then(function (usdt) {
    usdt.setDecimals(6);
    this.org.addStableCoin(usdt.address);
    return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'TUSD');
  }).then(function (tusd) {
    tusd.setDecimals(18);
    this.org.addStableCoin(tusd.address);
    return deployer.deploy(CS, this.org.address, this.gov.address, this.tap.address,
      this.fund.address, webPlatformAcct);
  }).then(function (cs) {
    this.gov.transferOwnership(cs.address);
    cs.proxyClaimOwnership(this.gov.address);
    return cs;
  });
}

function rinkeby (deployer, network) {
  const config = require('../deploy-config.json').rinkeby;
  const fs = require('fs');
  const admin = config.adminAcct;
  const webPlatformAcct = config.webPlatformAcct;
  const descOrganistaion = config.Organisation;
  const descFund = config.Fund;
  const descTap = config.Tap;
  const tapRate = config.TapRate;
  const stableCoins = config.StableCoins;

  return deployer.then(function () {
    return deployer.deploy(Token);
  }).then(function (token) {
    this.token = token;
    return deployer.deploy(Organization, descOrganistaion, token.address, admin);
  }).then(function (org) {
    this.org = org;
    for (const coin in stableCoins) {
      org.addStableCoin(stableCoins[coin]);
    }
    return deployer.deploy(Fund, org.address, descFund);
  }).then(function (fund) {
    this.fund = fund;
    return deployer.deploy(Gov, fund.address, Token.address);
  }).then(function (gov) {
    this.gov = gov;
    return deployer.deploy(Tap, this.gov.address, this.fund.address, tapRate, descTap);
  }).then(function (tap) {
    this.tap = tap;
    return deployer.deploy(CS, this.org.address, this.gov.address, this.tap.address,
      this.fund.address, webPlatformAcct);
  }).then(function (cs) {
    this.gov.transferOwnership(cs.address);
    cs.proxyClaimOwnership(this.gov.address);
    const contractsAddress = {
      admin: admin,
      web: webPlatformAcct,
      token: this.token.address,
      org: this.org.address,
      fund: this.fund.address,
      gov: this.gov.address,
      tap: this.tap.address,
      cs: cs.address,
    };
    console.log('** CONTRACTS BEGIN **');
    console.log(contractsAddress);
    console.log('** CONTRACTS END **');
    fs.writeFile('./build/RinkebyContractsAddress.json',
      JSON.stringify(contractsAddress),
      function (err) { if (err) throw err; });
    return cs;
  });
}

module.exports = function (deployer, network, accounts) {
  if (network === 'development') {
    return development(deployer, network, accounts);
  } else if (network === 'rinkeby') {
    return rinkeby(deployer, network);
  }
};
