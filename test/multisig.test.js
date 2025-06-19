const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Multisig", function () {
  let multisig, signers, owners, quorum;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    owners = [signers[0].address, signers[1].address, signers[2].address];
    quorum = 2;

    const Multisig = await ethers.getContractFactory("Multisig");
    multisig = await Multisig.deploy(owners, quorum);
    await multisig.waitForDeployment();
  });

  it("1. Initializes with correct owners and quorum", async () => {
    expect(await multisig.getOwners()).to.deep.equal(owners);
    expect(await multisig.getTransactionCount()).to.equal(0);
  });

  it("2. Allows an owner to submit a transaction", async () => {
    await multisig.connect(signers[0]).submitTransaction(owners[1], 1, "0x");
    const tx = await multisig.getTransaction(0);
    expect(tx.to).to.equal(owners[1]);
    expect(tx.value).to.equal(1);
  });

  it("3. Prevents non-owners from submitting transactions", async () => {
    await expect(
      multisig.connect(signers[4]).submitTransaction(owners[1], 1, "0x")
    ).to.be.revertedWith("not owner");
  });

  it("4. Allows multiple owners to confirm a transaction", async () => {
    await multisig.connect(signers[0]).submitTransaction(owners[1], 0, "0x");
    await multisig.connect(signers[0]).confirmTransaction(0);
    await multisig.connect(signers[1]).confirmTransaction(0);
    const tx = await multisig.getTransaction(0);
    expect(tx.numConfirmations).to.equal(2);
  });

  it("5. Prevents duplicate confirmations", async () => {
    await multisig.connect(signers[0]).submitTransaction(owners[1], 0, "0x");
    await multisig.connect(signers[0]).confirmTransaction(0);
    await expect(
      multisig.connect(signers[0]).confirmTransaction(0)
    ).to.be.revertedWith("Already Confirmed");
  });

  it("6. Executes transaction only after quorum", async () => {
    await multisig.connect(signers[0]).submitTransaction(owners[1], 0, "0x");
    await multisig.connect(signers[0]).confirmTransaction(0);
    await expect(
      multisig.connect(signers[0]).executeTransaction(0)
    ).to.be.revertedWith("not enough confirmations");
    await multisig.connect(signers[1]).confirmTransaction(0);
    await multisig.connect(signers[0]).executeTransaction(0);
    const tx = await multisig.getTransaction(0);
    expect(tx.executed).to.equal(true);
  });

  it("7. Prevents execution of already executed transaction", async () => {
    await multisig.connect(signers[0]).submitTransaction(owners[1], 0, "0x");
    await multisig.connect(signers[0]).confirmTransaction(0);
    await multisig.connect(signers[1]).confirmTransaction(0);
    await multisig.connect(signers[0]).executeTransaction(0);
    await expect(
      multisig.connect(signers[1]).executeTransaction(0)
    ).to.be.revertedWith("already executed");
  });

  it("8. Allows an owner to revoke confirmation before execution", async () => {
    await multisig.connect(signers[0]).submitTransaction(owners[1], 0, "0x");
    await multisig.connect(signers[0]).confirmTransaction(0);
    await multisig.connect(signers[0]).revokeConfirmation(0);
    const tx = await multisig.getTransaction(0);
    expect(tx.numConfirmations).to.equal(0);
  });

  it("9. Prevents revoking if not confirmed", async () => {
    await multisig.connect(signers[0]).submitTransaction(owners[1], 0, "0x");
    await expect(
      multisig.connect(signers[0]).revokeConfirmation(0)
    ).to.be.revertedWith("not confirmed");
  });

  it("10. Emits correct events on submit, confirm, revoke, and execute", async () => {
    await expect(
      multisig.connect(signers[0]).submitTransaction(owners[1], 0, "0x")
    ).to.emit(multisig, "SubmitTransaction");

    await multisig.connect(signers[0]).confirmTransaction(0);
    await expect(
      multisig.connect(signers[1]).confirmTransaction(0)
    ).to.emit(multisig, "ConfirmTransaction");

    await expect(
      multisig.connect(signers[0]).revokeConfirmation(0)
    ).to.emit(multisig, "RevokeConfirmation");

    await multisig.connect(signers[0]).confirmTransaction(0); // Reconfirm
    await expect(
      multisig.connect(signers[0]).executeTransaction(0)
    ).to.emit(multisig, "ExecuteTransaction");
  });
});