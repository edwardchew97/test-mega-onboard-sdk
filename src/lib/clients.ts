import { createPublicClient, createWalletClient, http, type Chain } from "viem";
import type { PrivateKeyAccount } from "viem/accounts";

export function createPublicClientForChain(chain: Chain, rpcUrl?: string) {
  const transport = rpcUrl ? http(rpcUrl) : http();
  return createPublicClient({ chain, transport });
}

export function createWalletClientForChain(
  chain: Chain,
  account: PrivateKeyAccount,
  rpcUrl?: string,
) {
  const transport = rpcUrl ? http(rpcUrl) : http();
  return createWalletClient({ account, chain, transport });
}
