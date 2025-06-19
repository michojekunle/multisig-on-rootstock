// scripts/deploy.js
const main = async () => {
  // Get 'MultisigFactory' contract
  const multisigfactoryContractFactory = await hre.ethers.getContractFactory(
    "MultisigFactory"
  );

  const owners = [
    "0xc0ffee254729296a45a3885639AC7E10F9d54979",
    "0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E",
    "0x913D2112F2Bf0ec05D73A85A4c0C3025f7160F29",
  ];
  const quorum = 2;
  // Deploy contract
  const multisigfactoryContract = await multisigfactoryContractFactory.deploy();
  console.log("⏳ Deploying MultisigFactory contract...");
  // Wait for the contract to be deployed
  await multisigfactoryContract.waitForDeployment();

  console.log(
    "✅ MultisigFactory Contract deployed to:",
    multisigfactoryContract.target
  );
  console.log(
    "⏳ Deploying Multisig contract with owners:",
    owners,
    "and quorum:",
    quorum
  );
  const deployMultisigCloneTx =
    await multisigfactoryContract.deployMultisig(owners, quorum);
  await deployMultisigCloneTx.wait();

  // get deployed multisigs
  const multisigClones = await multisigfactoryContract.getMultisigs();

  console.log("All multisig clones for this multisig factory", multisigClones);

  // get the recent deployed multisig address
  const recentMultisigCloneAddress = multisigClones[multisigClones.length - 1];

  console.log("recent multisig address", recentMultisigCloneAddress);
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
