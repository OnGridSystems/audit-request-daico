pragma solidity ^0.5.0;

import "../openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./Claimable.sol";
import "./IFund.sol";

contract Governance is Claimable {
    using SafeMath for uint256;

    IFund public fund;
    IERC20 public token;
    address public refundTap;

    enum State {Waiting, Votable, Refunding}
    State public state = State.Waiting;

    mapping(bytes32 => Poll) public polls;

    mapping(address => mapping(address => Amounts)) public contributions;
    mapping(address => uint256) public voterBalance;

    struct Poll {
        uint256 startTime;
        uint256 endTime;
        bool finished;
        uint256 yesTokens;
        uint256 noTokens;
        mapping(address => Vote) voter;
        address targetContract;
        bytes transaction;
    }

    struct Vote {
        uint256 time;
        uint256 tokens;
        bool agree;
    }

    struct Amounts {
        uint256 stableCoinAmount;
        uint256 tokenAmount;
    }

    event PollStarted(bytes32 pollHash);
    event PollFinished(bytes32 pollHash, bool result);

    constructor(address _fund, address _token) public {
        owner = msg.sender;
        fund = IFund(_fund);
        token = IERC20(_token);
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier pollActual(bytes32 _pollHash) {
        require(now >= polls[_pollHash].startTime && now <= polls[_pollHash].endTime);
        _;
    }

    modifier onlyFundHolder() {
        require(voterBalance[msg.sender] > 0);
//        require(fund.balanceOf(msg.sender) > 0);
        _;
    }

    /**
    * @dev Call claimOwnership of another contract.
    * @param _contractAddr The address of contract who must claim ownership.
    */
    function proxyClaimOwnership(address _contractAddr) external onlyOwner {
        Claimable instance = Claimable(_contractAddr);
        instance.claimOwnership();
    }

    function isMajority(uint256 yes, uint256 no) public pure returns (bool) {
        return yes > no;
    }

    function isQuorum(uint256 votedTokens, uint256 totalTokens) public pure returns (bool) {
        return votedTokens > (totalTokens.div(2));
    }

    function makeVotable() public onlyOwner {
        require(state == State.Waiting);
        state = State.Votable;
    }

    function startRefunding() public onlyOwner {
        require(state == State.Waiting);
        state = State.Refunding;
    }

    /**
    * @dev Refund stableCoins back to investor.
    * @param stableCoin address Address of stable coin to refund.
    */
    function refundContribution(address stableCoin) public {
        require(state == State.Refunding);
        require(contributions[msg.sender][stableCoin].stableCoinAmount > 0);
        uint256 amount = contributions[msg.sender][stableCoin].stableCoinAmount;
        contributions[msg.sender][stableCoin].stableCoinAmount = 0;
        contributions[msg.sender][stableCoin].tokenAmount = 0;
        fund.refund(stableCoin, msg.sender, amount);
    }

    /**
    * @dev withdraw tokens from Governance balance to investor personal account and decrease his voting power.this
    * @param amount uint256 Amount of tokens to withdraw.
    */
    function withdrawToken(uint256 amount) public {
        require(state == State.Votable);
        require(voterBalance[msg.sender] >= amount);
        voterBalance[msg.sender] = voterBalance[msg.sender].sub(amount);
        bool success = token.transfer(msg.sender, amount);
        if (!success) {
            revert("Transfer failed");
        }
    }

    /**
    * @dev Register investor's virtual balance
    * @param contributorAcc address Investor's address
    * @param stc address StableCoin address
    * @param stcAmount uint256 StableCoin amount
    * @param tokens uint256 Tokens amount
    */
    function registerContribution(address contributorAcc, address stc, uint256 stcAmount, uint256 tokens) public
    onlyOwner returns (bool) {
        contributions[contributorAcc][stc].stableCoinAmount =
        contributions[contributorAcc][stc].stableCoinAmount.add(stcAmount);
        contributions[contributorAcc][stc].tokenAmount = contributions[contributorAcc][stc].tokenAmount.add(tokens);
        voterBalance[contributorAcc] = voterBalance[contributorAcc].add(tokens);
        return true;
    }

    /**
     * @dev Start new poll
     * @param _targetContract address of contract where we want to execute transaction
     * @param _transaction transaction to be executed
     * @param _startTime voting start time
     * @param _endTime voting close time
     */
    function newPoll(
        address _targetContract, bytes memory _transaction, uint256 _startTime, uint256 _endTime
    ) public onlyFundHolder {
        require(state == State.Votable);
        require(_targetContract != address(0));
        require(_startTime >= now && _endTime > _startTime);
        require(_transaction.length >= 4);
        bytes32 _pollHash = keccak256(abi.encodePacked(_transaction, _targetContract, now));
        require(polls[_pollHash].transaction.length == 0);
        polls[_pollHash].startTime = _startTime;
        polls[_pollHash].endTime = _endTime;
        polls[_pollHash].targetContract = _targetContract;
        polls[_pollHash].transaction = _transaction;
        emit PollStarted(_pollHash);
    }

    /**
     * @dev Process user`s vote
     * @param _pollHash poll hash
     * @param agree True if user endorses the proposal else False
     */
    function vote(bytes32 _pollHash, bool agree) public onlyFundHolder pollActual(_pollHash) {
        require(polls[_pollHash].voter[msg.sender].time == 0);
        uint256 voiceTokens = fund.balanceOf(msg.sender);
        if (agree) {
            polls[_pollHash].yesTokens = polls[_pollHash].yesTokens.add(voiceTokens);
        } else {
            polls[_pollHash].noTokens = polls[_pollHash].noTokens.add(voiceTokens);
        }
        polls[_pollHash].voter[msg.sender].time = now;
        polls[_pollHash].voter[msg.sender].tokens = voiceTokens;
        polls[_pollHash].voter[msg.sender].agree = agree;
    }

    /**
    * @dev Revoke user`s vote
    */
    function revokeVote(bytes32 _pollHash) public pollActual(_pollHash) {
        require(polls[_pollHash].voter[msg.sender].time > 0);
        uint256 voiceTokens = polls[_pollHash].voter[msg.sender].tokens;
        bool agree = polls[_pollHash].voter[msg.sender].agree;
        polls[_pollHash].voter[msg.sender].time = 0;
        polls[_pollHash].voter[msg.sender].tokens = 0;
        polls[_pollHash].voter[msg.sender].agree = false;
        if (agree) {
            polls[_pollHash].yesTokens = polls[_pollHash].yesTokens.sub(voiceTokens);
        } else {
            polls[_pollHash].noTokens = polls[_pollHash].noTokens.sub(voiceTokens);
        }
    }

    /**
     * Finalize poll and call onPollFinish callback with result
     */
    function tryToFinalize(bytes32 _pollHash) public onlyFundHolder returns (bool) {
        require(!polls[_pollHash].finished);
        if (now < polls[_pollHash].endTime) {
            return false;
        }
        polls[_pollHash].finished = true;
        onPollFinish(_pollHash, pollResult(_pollHash));
        return true;
    }

    /**
    * @dev Sum yesTokens and noTokens
    * @param _pollHash poll hash
    */
    function totalVotedTokens(bytes32 _pollHash) public view returns (uint256) {
        return polls[_pollHash].yesTokens.add(polls[_pollHash].noTokens);
    }

    function pollResult(bytes32 _pollHash) internal view returns (bool) {
        return isMajority(polls[_pollHash].yesTokens, polls[_pollHash].noTokens) &&
        isQuorum(totalVotedTokens(_pollHash), token.totalSupply());
    }

    /**
     * @dev Process poll`s result
     * @param _pollHash poll hash
     * @param result poll`s result
     */
    function onPollFinish(bytes32 _pollHash, bool result) internal {
        if (result) {
            (bool success, bytes memory returnData) =
            //solhint-disable-next-line avoid-low-level-calls
            address(polls[_pollHash].targetContract).call(polls[_pollHash].transaction);
            require(success, string(returnData));
        }
        emit PollFinished(_pollHash, result);
    }
}
