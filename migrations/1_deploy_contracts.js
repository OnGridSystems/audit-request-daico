const Tap = artifacts.require('Tap');
const Fund = artifacts.require('Fund');
const Organization = artifacts.require('Organization');
const StableCoin = artifacts.require('StableCoin');
const Token = artifacts.require('ProjectToken');
const Gov = artifacts.require('Governance');
const CS = artifacts.require('CrowdSale');

module.exports = function (deployer, network, accounts) {
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
};
