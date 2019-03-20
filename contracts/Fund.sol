pragma solidity ^0.5.0;

/**
* @title Organization interface
*/
interface IOrg {
    function isStableCoin(address _stableCoin) external returns (bool);

    function getStableCoinCount() external view returns (uint256);

    function getStableCoin(uint256 i) external view returns (address);
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract IERC20 {
    uint8 public decimals;

    function transfer(address to, uint256 value) external returns (bool);

    function balanceOf(address _owner) external view returns (uint256 balance);
}

/**
* @title Fund
* @dev Very simple Fund
*/
contract Fund {
    IOrg public org; // Keeps the list of stablecoins
    string public name;

    /**
    * @dev Constructor
    */
    constructor (IOrg _org, string memory _name) public {
        name = _name;
        org = _org;
    }

    // ToDo add tapOnly modifier
    function withdrawStableCoin(address _stableCoin, address _to, uint256 _value) public returns (bool) {
        require(org.isStableCoin(_stableCoin), "Not a stableCoin");
        IERC20 stableCoin = IERC20(_stableCoin);
        stableCoin.transfer(_to, _value);
        // ToDo add event
    }

    function getTotalAmountInAtto() public view returns (uint256) {
        uint256 totalAtto;
        for (uint256 i = 0; i < org.getStableCoinCount(); i++) {
            address stableCoin = org.getStableCoin(i);
            uint256 balance = IERC20(stableCoin).balanceOf(address(this));
            uint256 decimals = IERC20(stableCoin).decimals();
            uint256 nDecimals = 18 - decimals;
            totalAtto = totalAtto + balance * (10 ** nDecimals);
        }
        return totalAtto;
    }

    // ToDo add Tap CRUD
    // ToDo add TapOnly modifier
}
