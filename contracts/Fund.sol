pragma solidity ^0.5.0;

import "./Claimable.sol";
import "../openzeppelin-solidity/contracts/math/SafeMath.sol";

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
*
* @dev Very simple Fund implementation.
* Fund keeps collected funds and allows them to be withdrawn through the Tap contract.
*/
contract Fund is Claimable {
    using SafeMath for uint256;

    IOrg public org; // Keeps the list of stablecoins
    string public name;
    mapping(address => bool) public isTap;
    address[] public taps;

    event TapAdded(address tap);
    event TapDeleted(address tap);
    event StableCoinWithdrawn(address stableCoin, address to, uint256 value);

    /**
    * @dev Constructor
    * @param _org address of Organization contract.
    * @param _name string The name of Fund.
    */
    constructor (IOrg _org, string memory _name) public {
        name = _name;
        org = _org;
    }

    /**
    * @dev Reverts if called from any address other than the Tap contract.
    */
    modifier onlyTap() {
        require(isTap[msg.sender]);
        _;
    }

    /**
    * @dev transfer StableCoins from Fund balance to supplied address.
    * @param _stableCoin address of desired Token.
    * @param _to address The address which you want to transfer to.
    * @param _value uint256 the amount of tokens to be transferred.
    * @return bool operation result.
    */
    function withdrawStableCoin(address _stableCoin, address _to, uint256 _value) public onlyTap returns (bool) {
        require(org.isStableCoin(_stableCoin), "Not a stableCoin");
        IERC20 stableCoin = IERC20(_stableCoin);
        uint256 decimals = IERC20(stableCoin).decimals();
        uint256 nDecimals = uint256(18).sub(decimals);
        uint256 balance = IERC20(stableCoin).balanceOf(address(this));
        // balance to atto
        uint256 aBalance = balance.mul(10 ** nDecimals);
        require(aBalance >= _value);
        uint256 nValue = _value.div(10 ** nDecimals);
        bool success = stableCoin.transfer(_to, nValue);
        if (success) {
            emit StableCoinWithdrawn(_stableCoin, _to, nValue);
        }
        return success;
    }

    /**
    * @dev Counts total Fund balance of all registered StableCoins.
    */
    function getTotalAmountInAtto() public view returns (uint256) {
        uint256 totalAtto;
        for (uint256 i = 0; i < org.getStableCoinCount(); i++) {
            address stableCoin = org.getStableCoin(i);
            uint256 balance = IERC20(stableCoin).balanceOf(address(this));
            uint256 decimals = IERC20(stableCoin).decimals();
            uint256 nDecimals = uint256(18).sub(decimals);
            totalAtto = totalAtto.add(balance.mul(10 ** nDecimals));
        }
        return totalAtto;
    }

    /**
    * @dev Add new tap address to list.
    * @param _tap address The address of new tap contract.
    */
    function addTap(address _tap) public onlyOwner {
        require(!isTap[_tap], "Already exists");
        taps.push(_tap);
        isTap[_tap] = true;
        emit TapAdded(_tap);
    }

    /**
    * @dev Delete tap address from list.
    * @param _tap address The address of tap contract for delete.
    */
    function delTap(address _tap) public onlyOwner {
        require(isTap[_tap], "Doesn't exist");
        for (uint256 i = 0; i < taps.length; i++) {
            if (taps[i] == _tap) {
                if (taps.length > 1) {
                    taps[i] = taps[taps.length - 1];
                }
                taps.length--; // Implicitly recovers gas from last element storage
                isTap[_tap] = false;
                emit TapDeleted(_tap);
                break;
            }
        }
    }

    /**
    * @dev Refund stableCoins to investor.
    * @param _stableCoin address Address of stable coin to refund.
    * @param _to address The address which you want to transfer to.
    * @param _amount uint256 The amount of tokens to refund
    */
    function refund(address _stableCoin, address _to, uint256 _amount) public onlyTap {
        require(org.isStableCoin(_stableCoin), "Not a stableCoin");
        IERC20 stableCoin = IERC20(_stableCoin);
        uint256 balance = stableCoin.balanceOf(address(this));
        require(balance >= _amount);
        bool success = stableCoin.transfer(_to, _amount);
        if (!success) {
            revert("Transfer failed");
        }
        emit StableCoinWithdrawn(_stableCoin, _to, _amount);
    }

}
