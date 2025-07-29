const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultisigFactory", function () {
  let MultisigFactory, multisigFactory, owner, addr1, addr2, addr3;
  const QUORUM = 2;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    MultisigFactory = await ethers.getContractFactory("MultisigFactory");
    multisigFactory = await MultisigFactory.deploy();
    await multisigFactory.waitForDeployment();
  });

  describe("deployMultisig", function () {
    it("should deploy a new Multisig wallet with valid parameters", async function () {
      const owners = [owner.address, addr1.address, addr2.address];

      const tx = await multisigFactory.deployMultisig(owners, QUORUM);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map(log => {
          try {
            return multisigFactory.interface.parseLog(log);
          } catch (err) {
            return null;
          }
        })
        .find(e => e && e.name === "MultisigDeployed");

      const multisigAddress = event.args.multisig;
      expect(ethers.isAddress(multisigAddress)).to.be.true;

      await expect(tx)
        .to.emit(multisigFactory, "MultisigDeployed")
        .withArgs(multisigAddress);

      const multisigContract = await ethers.getContractAt("Multisig", multisigAddress);
      const deployedOwners = await multisigContract.getOwners();
      expect(deployedOwners).to.have.lengthOf(3);
      expect(deployedOwners).to.include(owner.address);
      expect(deployedOwners).to.include(addr1.address);
      expect(deployedOwners).to.include(addr2.address);
    });

    it("should revert if owners array is empty", async function () {
      await expect(
        multisigFactory.deployMultisig([], QUORUM)
      ).to.be.revertedWith("no owners");
    });

    it("should revert if quorum is zero", async function () {
      const owners = [owner.address, addr1.address];
      await expect(
        multisigFactory.deployMultisig(owners, 0)
      ).to.be.revertedWith("bad request");
    });

    it("should revert if quorum is greater than number of owners", async function () {
      const owners = [owner.address, addr1.address];
      await expect(
        multisigFactory.deployMultisig(owners, 3)
      ).to.be.revertedWith("bad request");
    });

    it("should correctly update multisigClones array", async function () {
      const owners = [owner.address, addr1.address, addr2.address];

      await multisigFactory.deployMultisig(owners, QUORUM);
      expect((await multisigFactory.getMultisigs()).length).to.equal(1);

      await multisigFactory.deployMultisig(owners, QUORUM);
      expect((await multisigFactory.getMultisigs()).length).to.equal(2);
    });
  });

  describe("getMultisigs", function () {
    it("should return empty array when no multisigs deployed", async function () {
      const multisigs = await multisigFactory.getMultisigs();
      expect(multisigs).to.be.an("array").that.is.empty;
    });

    it("should return correct array of deployed multisigs", async function () {
      const owners = [owner.address, addr1.address, addr2.address];

      const tx1 = await multisigFactory.deployMultisig(owners, QUORUM);
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs
        .map(log => {
          try {
            return multisigFactory.interface.parseLog(log);
          } catch (err) {
            return null;
          }
        })
        .find(e => e && e.name === "MultisigDeployed");
      const multisig1 = event1.args.multisig;

      const tx2 = await multisigFactory.deployMultisig(owners, QUORUM);
      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs
        .map(log => {
          try {
            return multisigFactory.interface.parseLog(log);
          } catch (err) {
            return null;
          }
        })
        .find(e => e && e.name === "MultisigDeployed");
      const multisig2 = event2.args.multisig;

      const multisigs = await multisigFactory.getMultisigs();
      expect(multisigs).to.have.lengthOf(2);
      expect(multisigs).to.include(multisig1);
      expect(multisigs).to.include(multisig2);
    });
  });

  describe("Edge Cases", function () {
    it("should handle single owner with quorum of 1", async function () {
      const owners = [owner.address];
      const tx = await multisigFactory.deployMultisig(owners, 1);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map(log => {
          try {
            return multisigFactory.interface.parseLog(log);
          } catch (err) {
            return null;
          }
        })
        .find(e => e && e.name === "MultisigDeployed");

      const multisigAddress = event.args.multisig;

      const multisigContract = await ethers.getContractAt("Multisig", multisigAddress);
      const deployedOwners = await multisigContract.getOwners();
      console.log("Deployed owners:", deployedOwners);
      expect(deployedOwners).to.have.lengthOf(1);
      expect(deployedOwners[0]).to.equal(owner.address);
    });

    it("should handle maximum reasonable owners", async function () {
      const signers = await ethers.getSigners();
      const owners = signers.slice(0, 10).map(s => s.address);
      const quorum = 7;

      const tx = await multisigFactory.deployMultisig(owners, quorum);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map(log => {
          try {
            return multisigFactory.interface.parseLog(log);
          } catch (err) {
            return null;
          }
        })
        .find(e => e && e.name === "MultisigDeployed");

      const multisigAddress = event.args.multisig;
      expect(ethers.isAddress(multisigAddress)).to.be.true;
    });
  });
});
