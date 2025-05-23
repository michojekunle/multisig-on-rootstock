// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Multisig.sol";

contract MultisigFactory {
    // Event to log the address of each new Multisig wallet
    event MultisigDeployed(address indexed multisig);

    Multisig[] private multisigClones;

    // Function to create a new Multisig wallet
    function deployMultisig(
        address[] memory _owners,
        uint _quorum
    ) public returns (Multisig multisig_, uint256 length_) {
        // Create a new Multisig wallet
        Multisig multisig = new Multisig(_owners, _quorum);
        // Emit the event with the new wallet's address
        emit MultisigDeployed(address(multisig));

        multisig_ = multisig;
        multisigClones.push(multisig);
        length_ = multisigClones.length;
    }

    function getMultisigs() external view returns(Multisig[] memory multisigs_) {
        multisigs_ = multisigClones;
    }
}