import type { ConnectedWallet } from "@privy-io/react-auth";
import type { Address } from "viem";

export function isPrivyEmbeddedWallet(wallet?: ConnectedWallet): boolean {
  return Boolean(
    wallet &&
      wallet.type === "ethereum" &&
      (wallet.walletClientType === "privy" || wallet.walletClientType === "privy-v2"),
  );
}

export function getPrivyWalletAddress(wallet?: ConnectedWallet): Address | null {
  return (wallet?.address ?? null) as Address | null;
}
