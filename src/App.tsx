import { useCallback, useMemo, useState } from "react";
import { usePrivy, useSign7702Authorization, useWallets } from "@privy-io/react-auth";
import { type Address, type Chain, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import "./App.css";
import { appConfig } from "./config/appConfig";
import { createConfiguredChain } from "./config/chain";
import { OpenfortSection } from "./features/openfort/OpenfortSection";
import { useOpenfortActions } from "./features/openfort/useOpenfortActions";
import { PrivyAccountCard } from "./features/wallet/PrivyAccountCard";
import { useWalletActions } from "./features/wallet/useWalletActions";
import { useActivePrivyWallet } from "./hooks/useActivePrivyWallet";
import { useWalletBalance } from "./hooks/useWalletBalance";
import type { TxLog } from "./types/app";

function App() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { signAuthorization } = useSign7702Authorization();
  const { wallets } = useWallets();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txLogs, setTxLogs] = useState<TxLog[]>([]);

  const chain = useMemo<Chain>(
    () =>
      createConfiguredChain(
        appConfig.openfortChainId,
        appConfig.rpcUrl,
        appConfig.explorerBaseUrl,
      ),
    [],
  );

  const { activeEthereumWallet, privyWalletAddress } = useActivePrivyWallet(wallets);

  const deployerAddress = useMemo(() => {
    if (!appConfig.deployerPrivateKey) {
      return null;
    }
    try {
      return privateKeyToAccount(appConfig.deployerPrivateKey).address as Address;
    } catch {
      return null;
    }
  }, []);

  const { walletBalance, walletBalanceLoading } = useWalletBalance(
    authenticated,
    privyWalletAddress,
    chain,
    appConfig.rpcUrl,
  );

  const pushTxLog = useCallback((label: string, hash: Hex) => {
    const url = `${appConfig.explorerBaseUrl}/tx/${hash}`;
    setTxLogs((prev) => [{ label, hash, url }, ...prev]);
    return url;
  }, []);

  const { funding, sendingTestTx, handleFundPrivyWallet, handleSendPrivyToDeployer } =
    useWalletActions({
      productionSafeMode: appConfig.productionSafeMode,
      chain,
      rpcUrl: appConfig.rpcUrl,
      privyWalletAddress,
      activeEthereumWallet,
      deployerPrivateKey: appConfig.deployerPrivateKey,
      deployerAddress,
      pushTxLog,
      setStatus,
      setError,
    });

  const {
    deploying,
    addingPasskey,
    smartEoaAddress,
    passkeyPubKey,
    handleDeployOpenfort,
    handleAddPasskey,
  } = useOpenfortActions({
    chain,
    rpcUrl: appConfig.rpcUrl,
    implementationContract: appConfig.implementationContract,
    openfortDeployGas: appConfig.openfortDeployGas,
    activeEthereumWallet,
    privyWalletAddress,
    signAuthorization,
    pushTxLog,
    setStatus,
    setError,
  });

  return (
    <main className="app">
      <h1>Privy Wallet Demo</h1>
      <p className="muted">Authenticate with your app's standard Privy login flow.</p>

      {!ready && <p>Loading Privy...</p>}

      {ready && !authenticated && (
        <div className="actions">
          <button type="button" onClick={login}>
            Login with Privy
          </button>
        </div>
      )}

      {ready && authenticated && (
        <PrivyAccountCard
          user={user}
          privyWalletAddress={privyWalletAddress}
          deployerAddress={deployerAddress}
          productionSafeMode={appConfig.productionSafeMode}
          walletBalance={walletBalance}
          walletBalanceLoading={walletBalanceLoading}
          funding={funding}
          sendingTestTx={sendingTestTx}
          activeEthereumWallet={activeEthereumWallet}
          onFundPrivyWallet={handleFundPrivyWallet}
          onSendPrivyToDeployer={handleSendPrivyToDeployer}
          onLogout={logout}
        />
      )}

      <OpenfortSection
        productionSafeMode={appConfig.productionSafeMode}
        deploying={deploying}
        addingPasskey={addingPasskey}
        smartEoaAddress={smartEoaAddress}
        passkeyPubKey={passkeyPubKey}
        error={error}
        txLogs={txLogs}
        activeEthereumWallet={activeEthereumWallet}
        onDeployOpenfort={handleDeployOpenfort}
        onAddPasskey={handleAddPasskey}
      />

      {status && <p className="muted">{status}</p>}
    </main>
  );
}

export default App;
