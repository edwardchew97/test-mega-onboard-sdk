import type { Address, Hex } from "viem";

export type TxLog = {
  label: string;
  hash: Hex;
  url: string;
};

export type RpcAuthorization = {
  address: Address;
  chainId: Hex;
  nonce: Hex;
  yParity: Hex;
  r: Hex;
  s: Hex;
};

export type PasskeyPubKey = {
  x: Hex;
  y: Hex;
};
