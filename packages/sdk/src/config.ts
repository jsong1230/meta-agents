/**
 * Contract addresses — configurable, swap anytime.
 */

export interface ContractAddresses {
  identityRegistry: string;
  publicKeyResolver: string;
  serviceKeyResolver: string;
  agentRegistry: string;
  tradeLog: string;
}

export const TESTNET_CONTRACTS: ContractAddresses = {
  identityRegistry: "0x98ee60651533e561395098E1FF6653E68F579DdE",
  publicKeyResolver: "0xFD89c9dFC82f9f806E5aFd55cBA37ce02708F2Cf",
  serviceKeyResolver: "0x108A19883eA22D47FcB58862129c686994583dCf",
  agentRegistry: "0x3418ce33ec4369268e86b6DEd2288248da3dD39d",
  tradeLog: "0xB02239dEB85528a268f31a00EDFde682eFe268B6",
};

export const MAINNET_CONTRACTS: ContractAddresses = {
  identityRegistry: "0x42bbff659772231bb63c7c175a1021e080a4cf9d",
  publicKeyResolver: "0xd9f39ab902f835400Cfb424529BB0423D7342331",
  serviceKeyResolver: "0x5D4B8C6c6aBecf9B5277747fa15980B964C40Ce3",
  agentRegistry: "", // not deployed yet
  tradeLog: "",      // not deployed yet
};

export const TESTNET_RPC = "https://api.metadium.com/dev";
export const MAINNET_RPC = "https://api.metadium.com/prod";

export const TESTNET_CHAIN_ID = 12;
export const MAINNET_CHAIN_ID = 11;
