// scripts/deploy.js
const main = async () => {
  // Get 'Multisig' contract
  const multisigContractFactory = await hre.ethers.getContractFactory("Multisig");

  const owners = [
    "0xc0ffee254729296a45a3885639AC7E10F9d54979",
    "0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E",
    "0x913D2112F2Bf0ec05D73A85A4c0C3025f7160F29",
  ];
  const quorum = 2;
  // Deploy contract
  const multisigContract = await multisigContractFactory.deploy(owners, quorum);
  console.log("⏳ Deploying contract...");
  // Wait for the contract to be deployed
  await multisigContract.deployed;

  console.log("✅ Contract deployed to:", multisigContract.target);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();