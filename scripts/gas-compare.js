// scripts/gas-compare.js
const { ethers } = require("hardhat");

async function main() {
  const owners = [
    "0xc0ffee254729296a45a3885639AC7E10F9d54979",
    "0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E",
    "0x913D2112F2Bf0ec05D73A85A4c0C3025f7160F29",
  ];
  const quorum = 2;
    
  console.log("⏳ Deploying MultisigFactory with `new`...");
  const FactoryNew = await ethers.getContractFactory("MultisigFactory");
  const factoryNew = await FactoryNew.deploy();
  await factoryNew.waitForDeployment();
  console.log("✅ FactoryNew deployed:", await factoryNew.getAddress());

  console.log("\n⏳ Deploying MultisigFactory with `create2`...");
  const FactoryCreate2 = await ethers.getContractFactory("MultisigFactoryCreate2");
  const factoryCreate2 = await FactoryCreate2.deploy();
  await factoryCreate2.waitForDeployment();
  console.log("✅ FactoryCreate2 deployed:", await factoryCreate2.getAddress());

  // Deploy multisig via new
  console.log("\n⏳ Deploying Multisig with `factory using new`...");
  const tx1 = await factoryNew.deployMultisig(owners, quorum);
  const receipt1 = await tx1.wait();
  console.log("🧱 Gas used by `new` factory:", receipt1.gasUsed.toString());

  // Deploy wallet via create2
  console.log("\n⏳ Deploying Multisig with `factory using create2`...");
  const tx2 = await factoryCreate2.createMultisigClone(owners, quorum);
  const receipt2 = await tx2.wait();
  console.log("🧪 Gas used by `create2` factory:", receipt2.gasUsed.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
