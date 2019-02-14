const { BN } = require('openzeppelin-test-helpers');

const { shouldBehaveLikeERC20Burnable } = require(
  '../../openzeppelin-solidity/test/token/ERC20/behaviors/ERC20Burnable.behavior'
);
const ProjectToken = artifacts.require('ProjectToken');

contract('ERC20Burnable', function ([_, owner, ...otherAccounts]) {
  const initialBalance = new BN(1000);

  beforeEach(async function () {
    this.token = await ProjectToken.new();
    await this.token.mint(owner, initialBalance);
  });

  shouldBehaveLikeERC20Burnable(owner, initialBalance, otherAccounts);
});
