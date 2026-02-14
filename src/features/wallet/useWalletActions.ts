import type { ConnectedWallet } from "@privy-io/react-auth";
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import { toHex, type Address, type Chain, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClientForChain, createWalletClientForChain } from "../../lib/clients";

type UseWalletActionsParams = {
  productionSafeMode: boolean;
  chain: Chain;
  rpcUrl?: string;
  privyWalletAddress: Address | null;
  activeEthereumWallet?: ConnectedWallet;
  deployerPrivateKey?: Hex;
  deployerAddress: Address | null;
  pushTxLog: (label: string, hash: Hex) => string;
  setStatus: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function useWalletActions({
  productionSafeMode,
  chain,
  rpcUrl,
  privyWalletAddress,
  activeEthereumWallet,
  deployerPrivateKey,
  deployerAddress,
  pushTxLog,
  setStatus,
  setError,
}: UseWalletActionsParams) {
  const [funding, setFunding] = useState(false);
  const [sendingTestTx, setSendingTestTx] = useState(false);

  const handleFundPrivyWallet = useCallback(async () => {
    try {
      if (productionSafeMode) {
        throw new Error("Funding is disabled in production-safe mode.");
      }
      if (!privyWalletAddress) {
        throw new Error("Connect a Privy wallet first.");
      }
      if (!deployerPrivateKey) {
        throw new Error("Missing VITE_DEPLOYER_PRIVATE_KEY in .env.");
      }

      setFunding(true);
      setError(null);
      setStatus("Funding Privy wallet with 0.01 ETH...");

      const publicClient = createPublicClientForChain(chain, rpcUrl);
      const deployer = privateKeyToAccount(deployerPrivateKey);
      const walletClient = createWalletClientForChain(chain, deployer, rpcUrl);

      const hash = await walletClient.sendTransaction({
        account: deployer,
        to: privyWalletAddress,
        value: 10_000_000_000_000_000n,
      });
      const txUrl = pushTxLog("Fund Privy Wallet", hash);

      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Funded ${privyWalletAddress} with 0.01 ETH. Explorer: ${txUrl}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to fund Privy wallet.",
      );
      setStatus(null);
    } finally {
      setFunding(false);
    }
  }, [
    chain,
    deployerPrivateKey,
    privyWalletAddress,
    productionSafeMode,
    pushTxLog,
    rpcUrl,
    setError,
    setStatus,
  ]);

  const handleSendPrivyToDeployer = useCallback(async () => {
    try {
      if (productionSafeMode) {
        throw new Error("Test transfer is disabled in production-safe mode.");
      }
      if (!activeEthereumWallet || !privyWalletAddress) {
        throw new Error("No Privy embedded wallet found.");
      }
      if (!deployerAddress) {
        throw new Error("Missing or invalid VITE_DEPLOYER_PRIVATE_KEY in .env.");
      }

      setSendingTestTx(true);
      setError(null);
      setStatus(`Sending 0.00005 ETH from Privy wallet to deployer (${deployerAddress})...`);

      const provider = await activeEthereumWallet.getEthereumProvider();
      const publicClient = createPublicClientForChain(chain, rpcUrl);
      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: privyWalletAddress,
            to: deployerAddress,
            value: toHex(50_000_000_000_000n),
            chainId: toHex(BigInt(chain.id)),
          },
        ],
      })) as Hex;

      const txUrl = pushTxLog("Privy -> Deployer (0.00005 ETH)", hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`Sent 0.00005 ETH. Explorer: ${txUrl}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to send test transaction.",
      );
      setStatus(null);
    } finally {
      setSendingTestTx(false);
    }
  }, [
    activeEthereumWallet,
    chain,
    deployerAddress,
    privyWalletAddress,
    productionSafeMode,
    pushTxLog,
    rpcUrl,
    setError,
    setStatus,
  ]);

  return {
    funding,
    sendingTestTx,
    handleFundPrivyWallet,
    handleSendPrivyToDeployer,
  };
}
