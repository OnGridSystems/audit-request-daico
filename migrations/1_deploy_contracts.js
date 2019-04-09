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

  return deployer.deploy(Token).then(token => {
    return deployer.deploy(Organization, 'TestOrganisation', token.address, admin).then(org => {
      return deployer.deploy(Fund, Organization.address, 'TestFund').then(fund => {
        return deployer.deploy(Gov, fund.address, Token.address).then(gov => {
          return deployer.deploy(Tap, gov.address, fund.address, 154320987654320, 'TestTap').then(tap => {
            return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'DAI').then(dai => {
              dai.setDecimals(18);
              org.addStableCoin(dai.address);
              return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'USDC').then(usdc => {
                usdc.setDecimals(6);
                org.addStableCoin(usdc.address);
                return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'USDT').then(usdt => {
                  usdt.setDecimals(6);
                  org.addStableCoin(usdt.address);
                  return deployer.deploy(StableCoin, stableCoinHolder, 1000000, 'TUSD').then(tusd => {
                    tusd.setDecimals(18);
                    org.addStableCoin(tusd.address);
                    return deployer.deploy(CS, org.address, gov.address, tap.address, fund.address,
                      webPlatformAcct).then(cs => {
                      gov.transferOwnership(cs.address);
                      cs.proxyClaimOwnership(gov.address);
                      return cs;
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
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
  return deployer.deploy(Token).then(token => {
    return deployer.deploy(Organization, descOrganistaion, token.address, admin).then(org => {
      return deployer.deploy(Fund, Organization.address, descFund).then(fund => {
        return deployer.deploy(Gov, fund.address, Token.address).then(gov => {
          for (const coin in stableCoins) {
            org.addStableCoin(stableCoins[coin]);
          }
          return deployer.deploy(Tap, gov.address, fund.address, tapRate, descTap).then(tap => {
            return deployer.deploy(CS, org.address, gov.address, tap.address, fund.address,
              webPlatformAcct).then(cs => {
              gov.transferOwnership(cs.address);
              cs.proxyClaimOwnership(gov.address);
              const contractsAddress = {
                admin: admin,
                web: webPlatformAcct,
                token: token.address,
                org: org.address,
                fund: fund.address,
                gov: gov.address,
                tap: tap.address,
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
          });
        });
      });
    });
  });
}

module.exports = function (deployer, network, accounts) {
  if (network === 'development') {
    return development(deployer, network, accounts);
  } else if (network === 'rinkeby') {
    return rinkeby(deployer, network);
  }
};
