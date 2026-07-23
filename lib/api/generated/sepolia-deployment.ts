// Generated from boredlabsio/meraki-protocol@4b3b3c479737c6a412fa0d7e8ea340312d0681cc:deployments/sepolia.json. Do not edit.
export const sepoliaDeployment = {
  "schema": "MerakiDeploymentManifestV1",
  "chain": {
    "name": "Ethereum Sepolia",
    "chainId": 11155111,
    "rpcPolicy": "Public or operator-supplied Sepolia JSON-RPC; no credentials stored",
    "explorer": "https://sepolia.etherscan.io"
  },
  "source": {
    "repository": "boredlabsio/meraki-protocol",
    "commit": "eda91a012f87480f7246766534f56035af65104f",
    "compiler": "solc 0.8.24",
    "evmVersion": "shanghai",
    "optimizer": {
      "enabled": true,
      "runs": 200
    },
    "reproduction": "Runtime bytecode matched the recovered Hardhat build output; immutable ranges were normalized for LaunchFactory and BondingCurveMarket."
  },
  "observedAtBlock": 10772370,
  "generatedAt": "2026-07-18T03:39:08.000Z",
  "confidence": "verified",
  "contracts": {
    "launchRegistry": {
      "name": "LaunchRegistry",
      "address": "0xFf8196CbfB0674E9aA2fD44fE6Ba560864Aae060",
      "creationTransaction": "0x7de3380dc6c95238b1314dd14cba80398578cb50af8a33fc27e30a8d117b9c71",
      "creationBlock": 10772357,
      "creator": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
      "constructorArguments": {
        "owner": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61"
      },
      "runtimeBytecodeHash": "0xfc8b2d620763c90f8636611589d444d2880b072219c0cdb9fb55f57c12ffbe68",
      "owner": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
      "pauseState": "not implemented",
      "abi": "artifacts/contracts/LaunchRegistry.sol/LaunchRegistry.json",
      "sourceVerification": "Etherscan similar-match"
    },
    "launchFactory": {
      "name": "LaunchFactory",
      "address": "0x04d6FaBF22eC012742406fDa44643D53cc8872CD",
      "creationTransaction": "0xc888de9b1210d73fe65f67c4037e07deb9e71b4c8e0bea0b659f804dd325187d",
      "creationBlock": 10772365,
      "creator": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
      "runtimeBytecodeHash": "0x5cdf0dc8f906484020253bbef1f4b037427220e6676eecefc62e32d5426a695c",
      "owner": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
      "pauseState": "not implemented",
      "abi": "artifacts/contracts/LaunchFactory.sol/LaunchFactory.json",
      "sourceVerification": "Etherscan similar-match"
    },
    "feeSplitter": {
      "name": "FeeSplitter",
      "address": "0xA391673ef6Cb67F89bC4Ae04b63812AD814679E4",
      "creationTransaction": "0x126098ac3b16326388a8d7eca5b4d19b9d7c55768a82c5d0cd3d9088c1c407a6",
      "creationBlock": 10772359,
      "creator": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
      "runtimeBytecodeHash": "0x37033899dcfa1c7f5e2fc76044c3c1c80073b1798d193c9a09cfcc5d41db7ed5",
      "owner": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
      "pauseState": "not implemented",
      "abi": "artifacts/contracts/finance/FeeSplitter.sol/FeeSplitter.json",
      "sourceVerification": "Etherscan similar-match"
    },
    "testMarket": {
      "name": "BondingCurveMarket",
      "address": "0x9399f30f694D6265fbe097CdeBB851a4Bf1b1Eae",
      "creationTransaction": "0x44ffcf0666f7de6e6ef1f3b08be5520bdcb18c442eb5f636132957690d02fcfd",
      "creationBlock": 10772370,
      "creator": "0x04d6FaBF22eC012742406fDa44643D53cc8872CD",
      "runtimeBytecodeHash": "0xecb087cdd364d84dae5460fe52114ca2b94c2238a3b166f599c778d6daa10586",
      "owner": "0x0000000000000000000000000000000000000000",
      "pauseState": "not implemented",
      "migrationState": "migrated",
      "buyEligible": false,
      "launchToken": "0x93Ce31301D1278cb55b810a1cDE0EB81308FDaC5",
      "feeSplitter": "0xA391673ef6Cb67F89bC4Ae04b63812AD814679E4",
      "abi": "artifacts/contracts/BondingCurveMarket.sol/BondingCurveMarket.json",
      "sourceVerification": "Etherscan similar-match"
    }
  },
  "relationships": {
    "registryFactory": "0x04d6FaBF22eC012742406fDa44643D53cc8872CD",
    "factoryRegistry": "0xFf8196CbfB0674E9aA2fD44fE6Ba560864Aae060",
    "factoryFeeSplitter": "0xA391673ef6Cb67F89bC4Ae04b63812AD814679E4",
    "registryConfigId": 0,
    "registryToken": "0x93Ce31301D1278cb55b810a1cDE0EB81308FDaC5",
    "registryMarket": "0x9399f30f694D6265fbe097CdeBB851a4Bf1b1Eae"
  },
  "feeConfiguration": {
    "marketFeeBps": 100,
    "treasury": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
    "rewardsVault": "0x5249D427EC84298fBD59e104355BA362DbeB9767",
    "ops": "0x9E5B0a9Cb8A9Bc369b7aCa244E484187D8fd8F61",
    "splitBps": {
      "treasury": 5000,
      "rewards": 3500,
      "ops": 1500
    }
  },
  "evidence": [
    "Recovered ignored state/sepolia_deployment.json from the untouched workspace",
    "Sepolia JSON-RPC creation receipts, runtime code, and view calls",
    "Etherscan public address pages and creation transactions",
    "Recovered Hardhat build-info solc-0_8_24-a8883056964c710d96019a8eef08f9c667e5cf90"
  ]
} as const;
