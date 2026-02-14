import type { ConnectedWallet } from "@privy-io/react-auth";
import type { Hex } from "viem";
import { TransactionLogs } from "../../components/TransactionLogs";
import type { PasskeyPubKey, TxLog } from "../../types/app";
import { isPrivyEmbeddedWallet } from "../wallet/walletUtils";

type OpenfortSectionProps = {
  productionSafeMode: boolean;
  deploying: boolean;
  addingPasskey: boolean;
  smartEoaAddress: Hex | null;
  passkeyPubKey: PasskeyPubKey | null;
  error: string | null;
  txLogs: TxLog[];
  activeEthereumWallet?: ConnectedWallet;
  onDeployOpenfort: () => void;
  onAddPasskey: () => void;
};

export function OpenfortSection({
  productionSafeMode,
  deploying,
  addingPasskey,
  smartEoaAddress,
  passkeyPubKey,
  error,
  txLogs,
  activeEthereumWallet,
  onDeployOpenfort,
  onAddPasskey,
}: OpenfortSectionProps) {
  return (
    <section className="card">
      <h2>Openfort 7702 Smart Account</h2>
      <p className="muted">
        Deploy a smart EOA and then register a WebAuthn passkey key (direct onchain
        transactions).
      </p>
      {productionSafeMode && (
        <p className="muted">
          Production-safe mode is enabled. Deployer-key actions are hidden.
        </p>
      )}
      <div className="actions">
        <button
          type="button"
          onClick={onDeployOpenfort}
          disabled={deploying || !activeEthereumWallet || !isPrivyEmbeddedWallet(activeEthereumWallet)}
        >
          {deploying ? "Deploying..." : "Deploy Openfort 7702 Smart Account"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onAddPasskey}
          disabled={addingPasskey || !smartEoaAddress}
        >
          {addingPasskey ? "Adding passkey..." : "Add Passkey to Smart EOA"}
        </button>
      </div>
      <p>
        <strong>Smart EOA:</strong> {smartEoaAddress ?? "Not deployed"}
      </p>
      <p>
        <strong>Passkey public key:</strong>{" "}
        {passkeyPubKey ? `${passkeyPubKey.x}, ${passkeyPubKey.y}` : "Not connected"}
      </p>
      {error && <p className="error">{error}</p>}
      <TransactionLogs txLogs={txLogs} />
    </section>
  );
}
