import type { ConnectedWallet } from "@privy-io/react-auth";
import { useMemo } from "react";
import { getPrivyWalletAddress, isPrivyEmbeddedWallet } from "../features/wallet/walletUtils";

export function useActivePrivyWallet(wallets: ConnectedWallet[]) {
  const activeEthereumWallet = useMemo(
    () => wallets.find((wallet) => isPrivyEmbeddedWallet(wallet)),
    [wallets],
  ) as ConnectedWallet | undefined;

  const privyWalletAddress = useMemo(
    () => getPrivyWalletAddress(activeEthereumWallet),
    [activeEthereumWallet],
  );

  return { activeEthereumWallet, privyWalletAddress };
}
