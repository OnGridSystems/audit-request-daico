pragma solidity ^0.5.0;

/**
* @title Organization interface
*/
interface IOrg {
    function isStableCoin(address _stableCoin) external returns (bool);
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
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

    // ToDo add getTotalAmount func

    // ToDo add Tap CRUD
    // ToDo add TapOnly modifier
}
