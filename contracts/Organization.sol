pragma solidity ^0.5.0;

import "./Claimable.sol";


/**
 * @title Organization
 * @dev The root point of the structure keeping the links to all artifacts
 */
contract Organization is Claimable {
    string public name;
    address[] public stableCoins;
    mapping(address => bool) private _isStableCoin;
    address public token;

    event StableCoinAdded(address _address);
    event StableCoinDeleted(address _address);

    /**
     * @dev The Organization constructor sets the name and token
     */
    constructor (string memory _name, address _token, address _owner) public {
        name = _name;
        token = _token;
        owner = _owner;
    }

    function addStableCoin(address _addr) public onlyOwner {
        require(!isStableCoin(_addr), "Already exists");
        // ToDo check ERC-20 compliance
        stableCoins.push(_addr);
        _isStableCoin[_addr] = true;
        emit StableCoinAdded(_addr);
    }

    function delStableCoin(address _addr) public onlyOwner {
        require(isStableCoin(_addr), "Doesn't exist");
        for (uint256 i = 0; i < stableCoins.length; i++) {
            if (stableCoins[i] == _addr) {
                if (stableCoins.length > 1) {
                    stableCoins[i] = stableCoins[stableCoins.length - 1];
                }
                stableCoins.length--; // Implicitly recovers gas from last element storage
                _isStableCoin[_addr] = false;
                emit StableCoinDeleted(_addr);
                break;
            }
        }
    }

    function isStableCoin(address _addr) public view returns (bool) {
        return _isStableCoin[_addr];
    }

    function getStableCoinCount() public view returns (uint256) {
        return stableCoins.length;
    }

    function getStableCoin(uint256 i) public view returns (address) {
        return stableCoins[i];
    }
}
