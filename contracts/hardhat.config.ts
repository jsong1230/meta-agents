import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          viaIR: true,
        },
      },
      { version: "0.5.0" },
    ],
  },
  paths: {
    sources: "./src",
    tests: "./test",
  },
  networks: {
    metadium_testnet: {
      url: process.env.METADIUM_RPC_URL || "https://api.metadium.com/dev",
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [],
    },
    hardhat: {
      // Local development
    },
  },
};

export default config;
