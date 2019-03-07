pragma solidity ^0.5.0;

import "./Claimable.sol";


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
}


/**
 * @title Organization
 * @dev The root point of the structure keeping the links to all artifacts
 */
contract Organization is Claimable {
    string public name;
    address[] public stableCoins;
    address public token;

    /**
     * @dev The Organization constructor sets the name and token
     */
    constructor (string memory _name, address _token, address _owner) public {
        name = _name;
        token = _token;
        owner = _owner;
    }

    function addStableCoin(address _addr) public {
        require(!isStableCoin(_addr), "Already exists");
        // ToDo check ERC-20 compliance
        stableCoins.push(_addr);
        // ToDo add event
    }

    function delStableCoin(address _addr) public {
        require(isStableCoin(_addr), "Doesn't exist");
        for (uint256 i = 0; i < stableCoins.length; i++) {
            if (stableCoins[i] == _addr) {
                if (stableCoins.length > 1) {
                    stableCoins[i] = stableCoins[stableCoins.length-1];
                }
                stableCoins.length--; // Implicitly recovers gas from last element storage
                // ToDo add event
            }
        }
        revert("Stablecoin not found");
    }

    function isStableCoin(address _addr) public view returns (bool) {
        for (uint256 i = 0; i < stableCoins.length; i++) {
            if (stableCoins[i] == _addr) {
                return true;
            }
        }
        return false;
    }
}
