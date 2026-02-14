import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PrivyProvider } from "@privy-io/react-auth";
import { Buffer } from "buffer";
import App from "./App.tsx";
import { appConfig } from "./config/appConfig";
import { createConfiguredChain } from "./config/chain";
import "./index.css";

if (!(globalThis as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}

const chain = createConfiguredChain(
  appConfig.openfortChainId,
  appConfig.rpcUrl,
  appConfig.explorerBaseUrl,
);

if (!appConfig.privyAppId) {
  throw new Error("Missing VITE_PRIVY_APP_ID in your environment.");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PrivyProvider
      appId={appConfig.privyAppId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#0f172a",
        },
        loginMethods: ["email"],
        defaultChain: chain,
        supportedChains: [chain],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
);
