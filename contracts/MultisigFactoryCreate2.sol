// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Multisig} from './Multisig.sol';

contract MultisigFactoryCreate2 {
    Multisig[] private multisigClones;

    // A counter to use for creating unique salts
    uint256 private saltCounter;

    event MultisigCreated(address indexed multisigAddress, uint256 quorum, address[] validSigners);

    function createMultisigClone(address[] memory _owners, uint256 _quorum) external returns(Multisig multisig_, uint256 length_) {
        // Generate a unique salt using the counter
        uint256 salt = saltCounter++;
        
        // Compute the bytecode of the Multisig contract
        bytes memory bytecode = abi.encodePacked(
            type(Multisig).creationCode,
            abi.encode(_owners, _quorum)
        );
        
        // Use create2 to deploy the Multisig contract
        address multisigAddress;
        
        assembly {
            multisigAddress := create2(
                0, // Ether value sent with the deployment
                add(bytecode, 32), // Pointer to the bytecode
                mload(bytecode), // Bytecode length
                salt // Salt
            )
        }

        require(multisigAddress != address(0), "Failed to deploy contract");

        multisig_ = Multisig(payable(multisigAddress));
        multisigClones.push(multisig_);
        
        // Emit an event for tracking
        emit MultisigCreated(multisigAddress, _quorum, _owners);
        
        // Return the newly deployed contract address and the total number of contracts
        length_ = multisigClones.length;
    }

    function getMultisigs() external view returns(Multisig[] memory multisigs_) {
        multisigs_ = multisigClones;
    }
}