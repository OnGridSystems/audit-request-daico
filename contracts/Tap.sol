pragma solidity ^0.5.0;

import "./IFund.sol";
import "../openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title Tap
*
* @dev Simple Tap implementation allowing spender to withdraw stablecoins at given rate.
*/
contract Tap {
    using SafeMath for uint256;

    address public spender;
    IFund public fund;
    string public description;
    uint256 public rate; //atto
    uint256 public lastWithdrawTime;
    uint256 public excessAmount; //atto
    bool public active;

    /**
    * @dev Constructor that configures the initial bucket state on deployment.
    * @param _spender address The address who can call spend function.
    * @param _fund address of Fund contract.
    * @param _rate uint256 amount of attoDollas allowed to spend per second.
    * @param _description string Tap description.
    */
    constructor (
        address _spender,
        IFund _fund,
        uint256 _rate,
        string memory _description
    ) public {
        spender = _spender;
        fund = _fund;
        rate = _rate;
        description = _description;
        lastWithdrawTime = now;
    }

    /**
    * @dev Function transfer stablecoins from Fund balance to specified address.
    * @param to address The address to transfer to.
    * @param usdcAmount uint256 Amount of cents to transfer.
    * @param stablecoinAddr address The address of Token to transfer.
    */
    function spend(address to, uint256 usdcAmount, address stablecoinAddr) public {
        require(msg.sender == spender);
        uint256 available = availableForSpending();
        uint256 attoUsdc = usdcAmount.mul(10 ** 16); // 16 = 18 - 2 (dollar decimal = 2)
        require(available >= attoUsdc);

        bool success = fund.withdrawStableCoin(stablecoinAddr, to, attoUsdc);
        if (!success) {
            revert("Withdraw failed");
        }
        excessAmount = available.sub(attoUsdc);
        lastWithdrawTime = now;
    }

    /**
    * @dev Counts available for spending attoDollars at current moment.
    */
    function availableForSpending() internal view returns (uint256) {
        return (((now.sub(lastWithdrawTime)).mul(rate)).add(excessAmount));
    }
}
