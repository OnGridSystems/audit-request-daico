pragma solidity ^0.5.0;

import "../CrowdSale.sol";
import "../Governance.sol";

contract CrowdSaleStateMock is CrowdSale {

    constructor(Governance _gov) public CrowdSale(IOrg(0), Governance(0), address(0), address(0)) {
        gov = _gov;
    }

    function setInitState() public {
        state = State.Init;
    }

    function setPreSoftCapState() public {
        state = State.PreSoftCap;
    }

    function setPostSoftCapState() public {
        state = State.PostSoftCap;
    }

    function setraisedAUsd(uint256 _ausd) public {
        raisedAUsd = _ausd;
    } 

}

contract GovernanceStateMock is Governance(address(0), address(0)) {

    function setStateContribution() public {
        state = State.Contribution;
    }

    function setStateRefunding() public {
        state = State.Refunding;
    }

    function setStateVotable() public {
        state = State.Votable;
    }

}
