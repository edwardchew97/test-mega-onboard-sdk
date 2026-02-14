import type { ConnectedWallet } from "@privy-io/react-auth";
import { WebAuthnP256 } from "ox";
import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import {
  encodeFunctionData,
  toHex,
  type Address,
  type Chain,
  type Hex,
  zeroAddress,
} from "viem";
import { withTimeout } from "../../lib/async";
import { createPublicClientForChain } from "../../lib/clients";
import { openfortAccountAbi } from "../../openfort/accountAbi";
import type { PasskeyPubKey } from "../../types/app";
import { OPENFORT_KEY_TYPE, signInitMessage, toRpcAuthorization } from "./openfortUtils";

type SignAuthorization = (
  params: { contractAddress: Hex; chainId: number },
  options: { address: Address },
) => Promise<{
  address: Address;
  chainId: number;
  nonce: number;
  yParity: number;
  r: Hex;
  s: Hex;
}>;

type UseOpenfortActionsParams = {
  chain: Chain;
  rpcUrl?: string;
  implementationContract?: Hex;
  openfortDeployGas: bigint;
  activeEthereumWallet?: ConnectedWallet;
  privyWalletAddress: Address | null;
  signAuthorization: SignAuthorization;
  pushTxLog: (label: string, hash: Hex) => string;
  setStatus: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function useOpenfortActions({
  chain,
  rpcUrl,
  implementationContract,
  openfortDeployGas,
  activeEthereumWallet,
  privyWalletAddress,
  signAuthorization,
  pushTxLog,
  setStatus,
  setError,
}: UseOpenfortActionsParams) {
  const [deploying, setDeploying] = useState(false);
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [smartEoaAddress, setSmartEoaAddress] = useState<Hex | null>(null);
  const [passkeyPubKey, setPasskeyPubKey] = useState<PasskeyPubKey | null>(null);

  const handleDeployOpenfort = useCallback(async () => {
    try {
      if (!activeEthereumWallet || !privyWalletAddress) {
        throw new Error(
          "No Privy embedded wallet found. Connect/login with a Privy wallet first.",
        );
      }
      if (!implementationContract) {
        throw new Error(
          "Missing VITE_OPENFORT_IMPLEMENTATION_CONTRACT for Openfort section.",
        );
      }

      setDeploying(true);
      setError(null);
      setStatus("Deploying Openfort 7702 smart account...");

      const publicClient = createPublicClientForChain(chain, rpcUrl);
      const provider = await activeEthereumWallet.getEthereumProvider();

      setStatus("Requesting Privy 7702 signature (official signAuthorization)...");
      const authorization = await withTimeout(
        signAuthorization(
          {
            contractAddress: implementationContract,
            chainId: chain.id,
          },
          {
            address: privyWalletAddress,
          },
        ),
        30000,
        "Timed out waiting for Privy signAuthorization (30s).",
      );
      const rpcAuthorization = toRpcAuthorization(authorization);

      setStatus("7702 authorization signed. Building initialize calldata...");
      const { messageHash, signature: initSignature } = await signInitMessage(
        provider,
        privyWalletAddress,
      );
      const farFuture = BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365);
      const zero32 = `0x${"00".repeat(32)}` as Hex;

      const callData = encodeFunctionData({
        abi: openfortAccountAbi,
        functionName: "initialize",
        args: [
          {
            pubKey: {
              x: zero32,
              y: zero32,
            },
            eoaAddress: privyWalletAddress,
            keyType: OPENFORT_KEY_TYPE.EOA,
          },
          {
            token: zeroAddress,
            limit: 0n,
          },
          [],
          messageHash,
          initSignature,
          farFuture,
          1n,
        ],
      });

      setStatus("Sending 7702 deployment transaction...");
      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: privyWalletAddress,
            to: privyWalletAddress,
            data: callData,
            gas: toHex(openfortDeployGas),
            chainId: toHex(BigInt(chain.id)),
            authorizationList: [rpcAuthorization],
          },
        ],
      })) as Hex;
      const txUrl = pushTxLog("Deploy Openfort 7702", hash);

      await publicClient.waitForTransactionReceipt({ hash });
      setSmartEoaAddress(privyWalletAddress);
      setStatus(
        `Openfort 7702 smart account deployed at ${privyWalletAddress}. Explorer: ${txUrl}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to deploy Openfort smart account.",
      );
      setStatus(null);
    } finally {
      setDeploying(false);
    }
  }, [
    activeEthereumWallet,
    chain,
    implementationContract,
    openfortDeployGas,
    privyWalletAddress,
    pushTxLog,
    rpcUrl,
    setError,
    setStatus,
    signAuthorization,
  ]);

  const handleAddPasskey = useCallback(async () => {
    try {
      if (!activeEthereumWallet || !smartEoaAddress) {
        throw new Error("No Privy embedded wallet found (or deploy not completed).");
      }

      setAddingPasskey(true);
      setError(null);
      setStatus("Creating passkey and registering it on your smart EOA...");

      const publicClient = createPublicClientForChain(chain, rpcUrl);
      const provider = await activeEthereumWallet.getEthereumProvider();
      const credential = await WebAuthnP256.createCredential({
        authenticatorSelection: {
          requireResidentKey: false,
          residentKey: "preferred",
          userVerification: "required",
        },
        user: {
          id: new TextEncoder().encode(smartEoaAddress),
          name: `${smartEoaAddress.slice(0, 6)}...${smartEoaAddress.slice(-4)}`,
        },
      });

      const x = toHex(credential.publicKey.x, { size: 32 });
      const y = toHex(credential.publicKey.y, { size: 32 });

      const validUntil = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;
      const callData = encodeFunctionData({
        abi: openfortAccountAbi,
        functionName: "registerSessionKey",
        args: [
          {
            pubKey: { x, y },
            eoaAddress: zeroAddress,
            keyType: OPENFORT_KEY_TYPE.WEBAUTHN,
          },
          validUntil,
          0,
          0,
          false,
          zeroAddress,
          {
            token: zeroAddress,
            limit: 0n,
          },
          [],
          0n,
        ],
      });

      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: smartEoaAddress,
            to: smartEoaAddress,
            data: callData,
          },
        ],
      })) as Hex;
      const txUrl = pushTxLog("Add Passkey", hash);

      await publicClient.waitForTransactionReceipt({ hash });
      setPasskeyPubKey({ x, y });
      setStatus(`Passkey connected to smart EOA. Explorer: ${txUrl}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to add passkey.");
      setStatus(null);
    } finally {
      setAddingPasskey(false);
    }
  }, [
    activeEthereumWallet,
    chain,
    pushTxLog,
    rpcUrl,
    setError,
    setStatus,
    smartEoaAddress,
  ]);

  return {
    deploying,
    addingPasskey,
    smartEoaAddress,
    passkeyPubKey,
    handleDeployOpenfort,
    handleAddPasskey,
  };
}
