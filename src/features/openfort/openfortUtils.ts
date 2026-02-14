import type { EIP1193Provider } from "@privy-io/react-auth";
import { hashMessage, toHex, type Address, type Hex } from "viem";
import type { RpcAuthorization } from "../../types/app";

export const OPENFORT_KEY_TYPE = {
  EOA: 0,
  WEBAUTHN: 1,
} as const;

export function toRpcAuthorization(authorization: {
  address: Address;
  chainId: number;
  nonce: number;
  yParity: number;
  r: Hex;
  s: Hex;
}): RpcAuthorization {
  return {
    address: authorization.address,
    chainId: toHex(BigInt(authorization.chainId)),
    nonce: toHex(BigInt(authorization.nonce)),
    yParity: toHex(BigInt(authorization.yParity)),
    r: authorization.r,
    s: authorization.s,
  };
}

export async function signInitMessage(provider: EIP1193Provider, address: Address) {
  const message = "Hello OPF7702";
  const signature = (await provider.request({
    method: "personal_sign",
    params: [toHex(message), address],
  })) as Hex;
  return { messageHash: hashMessage(message), signature };
}
