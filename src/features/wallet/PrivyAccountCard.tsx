import type { User } from "@privy-io/react-auth";
import type { Address } from "viem";
import type { ConnectedWallet } from "@privy-io/react-auth";
import { isPrivyEmbeddedWallet } from "./walletUtils";

type PrivyAccountCardProps = {
  user: User | null;
  privyWalletAddress: Address | null;
  deployerAddress: Address | null;
  productionSafeMode: boolean;
  walletBalance: string | null;
  walletBalanceLoading: boolean;
  funding: boolean;
  sendingTestTx: boolean;
  activeEthereumWallet?: ConnectedWallet;
  onFundPrivyWallet: () => void;
  onSendPrivyToDeployer: () => void;
  onLogout: () => void;
};

export function PrivyAccountCard({
  user,
  privyWalletAddress,
  deployerAddress,
  productionSafeMode,
  walletBalance,
  walletBalanceLoading,
  funding,
  sendingTestTx,
  activeEthereumWallet,
  onFundPrivyWallet,
  onSendPrivyToDeployer,
  onLogout,
}: PrivyAccountCardProps) {
  return (
    <div className="card">
      <p>
        <strong>User ID:</strong> {user?.id}
      </p>
      <p>
        <strong>Wallet:</strong> {privyWalletAddress ?? "Not connected"}
      </p>
      <p>
        <strong>Deployer Wallet:</strong>{" "}
        {productionSafeMode
          ? "Hidden in production"
          : (deployerAddress ?? "Not configured")}
      </p>
      <p>
        <strong>ETH balance:</strong>{" "}
        {!privyWalletAddress
          ? "N/A"
          : walletBalanceLoading
            ? "Loading..."
            : `${walletBalance ?? "0"} ETH`}
      </p>
      <div className="actions">
        {!productionSafeMode && (
          <button
            type="button"
            className="secondary"
            onClick={onFundPrivyWallet}
            disabled={funding || !privyWalletAddress || !activeEthereumWallet}
          >
            {funding ? "Funding..." : "Fund Privy Wallet (0.01 ETH)"}
          </button>
        )}
        {!productionSafeMode && (
          <button
            type="button"
            className="secondary"
            onClick={onSendPrivyToDeployer}
            disabled={
              sendingTestTx ||
              !activeEthereumWallet ||
              !privyWalletAddress ||
              !deployerAddress ||
              !isPrivyEmbeddedWallet(activeEthereumWallet)
            }
          >
            {sendingTestTx ? "Sending..." : "Send 0.00005 ETH to Deployer"}
          </button>
        )}
        <button type="button" className="secondary" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
