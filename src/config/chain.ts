import { defineChain, type Chain } from "viem";

export function createConfiguredChain(
  chainId: number,
  rpcUrl?: string,
  explorerBaseUrl = "https://testnet-mega.etherscan.io",
): Chain {
  return defineChain({
    id: chainId,
    name: "Configured EVM",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: {
      default: {
        http: [rpcUrl || "https://carrot.megaeth.com/rpc"],
      },
    },
    blockExplorers: {
      default: {
        name: "Explorer",
        url: explorerBaseUrl,
      },
    },
  });
}
