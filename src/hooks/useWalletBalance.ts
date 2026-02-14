import { useEffect, useState } from "react";
import { formatEther, type Address, type Chain } from "viem";
import { createPublicClientForChain } from "../lib/clients";

export function useWalletBalance(
  authenticated: boolean,
  address: Address | null,
  chain: Chain,
  rpcUrl?: string,
) {
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [walletBalanceLoading, setWalletBalanceLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadWalletBalance = async () => {
      if (!authenticated || !address) {
        setWalletBalance(null);
        return;
      }

      setWalletBalanceLoading(true);
      try {
        const publicClient = createPublicClientForChain(chain, rpcUrl);
        const balance = await publicClient.getBalance({ address });
        if (!cancelled) {
          setWalletBalance(formatEther(balance));
        }
      } catch {
        if (!cancelled) {
          setWalletBalance(null);
        }
      } finally {
        if (!cancelled) {
          setWalletBalanceLoading(false);
        }
      }
    };

    void loadWalletBalance();

    return () => {
      cancelled = true;
    };
  }, [authenticated, address, chain, rpcUrl]);

  return { walletBalance, walletBalanceLoading };
}
