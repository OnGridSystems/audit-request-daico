const { shouldBehaveLikeERC20Mintable } = require(
  '../../openzeppelin-solidity/test/token/ERC20/behaviors/ERC20Mintable.behavior'
);
const ERC20MintableMock = artifacts.require('ProjectToken');

contract('ERC20Mintable', function ([_, minter, otherMinter, ...otherAccounts]) {
  beforeEach(async function () {
    this.token = await ERC20MintableMock.new({ from: minter });
  });

  shouldBehaveLikeERC20Mintable(minter, otherAccounts);
});
