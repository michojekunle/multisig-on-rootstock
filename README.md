# 🛡️ Multisig Wallet Factory Smart Contract

## Overview

This project provides a **Multisig Wallet Factory** that allows users or organizations to deploy customized **multisig wallets**. It supports two deployment methods:

* **Standard deployment** (`new` opcode)
* **Deterministic deployment using `CREATE2`**

Each wallet allows multiple owners to manage funds and approve transactions collectively with a configurable **quorum (minimum number of approvals required)**.

This factory pattern makes it easy to deploy and track multiple wallets from a single factory instance, ideal for DAOs, joint accounts, team treasuries, and shared control applications.

## ✨ Features

* **Multisig Wallet Deployment**

  * Deploy wallets with custom owners and quorum settings.
  * Supports both `new` and `CREATE2` deployments.

* **Ownership Management**

  * Flexible owner configuration (single or multiple).
  * Configurable approval threshold (quorum).

* **Factory Tracking**

  * Each deployed wallet is stored and accessible via the factory.
  * Supports querying all deployed multisig instances.

* **CREATE2 Support**

  * Deterministic wallet address generation for predictable deployments.

* **Security Validations**

  * Input checks to prevent misconfigured wallets.
  * Event logging for on-chain tracking.

## 🧱 Smart Contract Architecture

### Contracts

* **`Multisig.sol`**

  * The core multisig wallet contract.
  * Accepts owners and quorum during deployment.
  * Manages transaction proposals and approvals (extendable).

* **`MultisigFactory.sol`**

  * Factory that deploys wallets using the standard `new` keyword.
  * Emits `MultisigDeployed` events.

* **`MultisigFactoryCreate2.sol`**

  * Factory that deploys wallets using `CREATE2` for deterministic addresses.
  * Emits `MultisigCreated` events.
  * Includes salt counter to ensure unique deployments.

## ⚙️ Contract Usage

### 1. Deploying a Multisig Wallet (Standard `new`)

Call the `deployMultisig` function in `MultisigFactory`:

```solidity
function deployMultisig(address[] memory _owners, uint256 _quorum) public returns (Multisig multisig_, uint256 length_);
```

* `_owners`: An array of wallet owners.
* `_quorum`: Minimum number of approvals needed for transaction execution.

📦 Example:

```solidity
address[] memory owners = [owner1, owner2, owner3];
uint256 quorum = 2;

multisigFactory.deployMultisig(owners, quorum);
```

### 2. Deploying a Multisig Wallet (Using `CREATE2`)

Call the `createMultisigClone` function in `MultisigFactoryCreate2`:

```solidity
function createMultisigClone(address[] memory _owners, uint256 _quorum) external returns(Multisig multisig_, uint256 length_);
```

📦 Example:

```solidity
multisigFactoryCreate2.createMultisigClone(owners, 2);
```

### 3. Viewing All Deployed Wallets

Retrieve a list of all deployed multisig contracts:

```solidity
function getMultisigs() external view returns(Multisig[] memory);
```

## ✅ Security Considerations

1. **Input Validation**

   * Reverts if no owners are provided.
   * Reverts if quorum is 0 or greater than number of owners.

2. **Safe Deployment**

   * Prevents contract deployment failure with checks after `create2`.

3. **Factory Controlled**

   * Only the factory controls deployment; logic is not upgradeable.

## 🧪 Testing

Comprehensive unit tests are included to validate:

* Wallet creation and event emission.
* Input validation (no owners, invalid quorum).
* Deployment count tracking.
* Edge cases like single-owner wallets or maximum owners.

### Running Tests

Run tests with:

```bash
npx hardhat test
```

## 🚀 Deployment

### Prerequisites

* Node.js
* Hardhat
* Environment variables:

  * `WALLET_KEY`
  * `ROOTSTOCK_TESTNET_RPC_URL`

### 1. Setup

Install dependencies:

```bash
npm install
```

Set up `.env`:

```env
WALLET_KEY="your-private-key"
ROOTSTOCK_TESTNET_RPC_URL="https://your-rootstock-testnet-url"
```

### 2. Hardhat Config

Add the Rootstock config in `hardhat.config.js`:

```js
require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // for testnet
    rootstock: {
      url: process.env.ROOTSTOCK_TESTNET_RPC_URL,
      accounts: [process.env.WALLET_KEY],
    },
  },
  etherscan: {
    // Use "123" as a placeholder, because Blockscout doesn't need a real API key, and Hardhat will complain if this property isn't set.
    apiKey: {
      rootstock: '123',
    },
    customChains: [
      {
        network: "rootstock",
        chainId: 31,
        urls: {
          apiURL: "https://rootstock-testnet.blockscout.com/api/",
          browserURL: "https://rootstock-testnet.blockscout.com/",
        }
      },
    ],
  },
  sourcify: {
    enabled: false,
  }
};
```

### 3. Deploy MultisigFactory

Standard deployment using `new`:

```bash
npx hardhat run scripts/deploy.js --network rootstock
```

CREATE2 deployment:

```bash
npx hardhat run scripts/deploy-create2-multisig.js --network rootstock
```

## 🧪 Example Output

```bash
✅ MultisigFactory Contract deployed to: 0xFactoryAddress
⏳ Deploying Multisig contract with owners: [...] and quorum: 2
All multisig clones for this multisig factory [0xWallet1, 0xWallet2]
recent multisig address 0xWallet2
```

## 🔐 Events

* `MultisigDeployed(address indexed multisig)`
* `MultisigCreated(address indexed multisigAddress, uint256 quorum, address[] validSigners)`

These events are helpful for tracking deployments on-chain and off-chain (e.g., subgraphs or frontends).

## 📄 License

This project is licensed under the MIT License. Use it freely for personal or commercial projects.

## 🤝 Contributing

Contributions and suggestions are welcome! Fork the repo, create a feature branch, and open a pull request.

```md
Thank you for checking out the Multisig Factory system. Whether you're building DAO tooling or secure wallets for your team, this system is here to simplify deployment. Secure. Scalable. Simple. 🚀
```
