import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
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
