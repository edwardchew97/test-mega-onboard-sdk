import type { Hex } from "viem";

export type AppConfig = {
  productionSafeMode: boolean;
  privyAppId?: string;
  openfortChainId: number;
  rpcUrl?: string;
  explorerBaseUrl: string;
  implementationContract?: Hex;
  deployerPrivateKey?: Hex;
  openfortDeployGas: bigint;
};

export const appConfig: AppConfig = {
  productionSafeMode: import.meta.env.PROD,
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID?.trim(),
  openfortChainId: Number(import.meta.env.VITE_OPENFORT_CHAIN_ID ?? 84532),
  rpcUrl: import.meta.env.VITE_RPC_URL?.trim(),
  explorerBaseUrl: (
    import.meta.env.VITE_EXPLORER_BASE_URL?.trim() ||
    "https://testnet-mega.etherscan.io"
  ).replace(/\/$/, ""),
  implementationContract:
    import.meta.env.VITE_OPENFORT_IMPLEMENTATION_CONTRACT?.trim() as
      | Hex
      | undefined,
  deployerPrivateKey: import.meta.env.VITE_DEPLOYER_PRIVATE_KEY?.trim() as
    | Hex
    | undefined,
  openfortDeployGas: BigInt(import.meta.env.VITE_OPENFORT_DEPLOY_GAS ?? "1200000"),
};
