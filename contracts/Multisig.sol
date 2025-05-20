// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Multisig {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    /// @notice Emitted when a confirmation is revoked
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);

    address[] private owners;
    mapping(address => bool) private isOwner;
    uint private quorum;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numConfirmations;
    }

    Transaction[] private transactions;
    mapping(uint => mapping(address => bool)) private confirmations;

    /// @dev Checks if the sender is an owner
    function _onlyOwner() private view {
        require(isOwner[msg.sender], "not owner"); 
    }

    /// @dev Checks if the transaction exists
    function _txExists(uint _txIndex) private view {
        require(_txIndex < transactions.length, "tx doesn't exist");
    }

    /// @dev Checks if the transaction is not executed
    function _notExecuted(uint _txIndex) private view {
        require(!transactions[_txIndex].executed, "already executed");
    }

    /// @dev Checks if the transaction is not confirmed by sender
    function _notConfirmed(uint _txIndex) private view {
        require(!confirmations[_txIndex][msg.sender], "Already Confirmed");
    }

    /// @dev Checks if the transaction is confirmed by sender
    function _isConfirmed(uint _txIndex) private view {
        require(confirmations[_txIndex][msg.sender], "not confirmed");
    }

    /// @notice Initializes the multisig wallet with owners and quorum confirmations
    /// @param _owners List of owner addresses
    /// @param _quorum Number of quorum confirmations
    constructor(address[] memory _owners, uint _quorum) {
        require(_owners.length > 0, "no owners");
        require(_quorum > 0 && _quorum <= _owners.length, "bad request");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "zero address detcted");
            require(!isOwner[owner], "owner already exists, duplicate owner");

            isOwner[owner] = true;
            owners.push(owner);
        }
        quorum = _quorum;
    }

    /// @notice Fallback to receive ether
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    /// @notice Submit a transaction for confirmation
    /// @param _to Destination address
    /// @param _value Amount of ether to send
    /// @param _data Transaction data
    function submitTransaction(
        address _to,
        uint _value,
        bytes calldata _data
    ) external {
        _onlyOwner();
        require(_to != address(0), "Address to cannot be zero address");

        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0
            })
        );

        emit SubmitTransaction(
            msg.sender,
            transactions.length - 1,
            _to,
            _value,
            _data
        );
    }

    /// @notice Confirm a transaction
    /// @param _txIndex Transaction index
    function confirmTransaction(uint _txIndex) external {
        _onlyOwner();
        _txExists(_txIndex);
        _notExecuted(_txIndex);
        _notConfirmed(_txIndex);

        confirmations[_txIndex][msg.sender] = true;
        transactions[_txIndex].numConfirmations += 1;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    /// @notice Execute a confirmed transaction
    /// @param _txIndex Transaction index
    function executeTransaction(uint _txIndex) external {
        _onlyOwner();
        _txExists(_txIndex);
        _notExecuted(_txIndex);

        Transaction storage txn = transactions[_txIndex];
        require(txn.numConfirmations >= quorum, "not enough confirmations");

        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    /// @notice Revoke a confirmation for a transaction
    /// @param _txIndex Transaction index
    function revokeConfirmation(uint _txIndex) external {
        _onlyOwner();
        _txExists(_txIndex);
        _notExecuted(_txIndex);
        _isConfirmed(_txIndex);

        confirmations[_txIndex][msg.sender] = false;
        transactions[_txIndex].numConfirmations -= 1;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    /// @notice Returns list of owners
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /// @notice Returns transaction count
    function getTransactionCount() external view returns (uint) {
        return transactions.length;
    }

    /// @notice Returns transaction details
    function getTransaction(
        uint _txIndex
    )
        external
        view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        )
    {
        _txExists(_txIndex);
        Transaction storage txn = transactions[_txIndex];
        return (
            txn.to,
            txn.value,
            txn.data,
            txn.executed,
            txn.numConfirmations
        );
    }

    /// @notice Returns if an owner confirmed a transaction
    function isConfirmed(
        uint _txIndex,
        address _owner
    ) external view returns (bool) {
        _txExists(_txIndex);
        return confirmations[_txIndex][_owner];
    }
}