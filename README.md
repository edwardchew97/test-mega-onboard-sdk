# Privy Wallet Starter

Vite + React + TypeScript starter wired to Privy with:
- Standard app auth/login with Privy (`login`)
- Embedded Ethereum wallet creation on login
- Openfort 7702 section:
  - deploy smart EOA
  - add WebAuthn passkey and display public key

## 1. Install dependencies

```bash
bun install
```

## 2. Configure environment variables

Copy `.env.example` to `.env` and set:

```env
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_RPC_URL=your_rpc_url
VITE_OPENFORT_CHAIN_ID=84532
VITE_OPENFORT_IMPLEMENTATION_CONTRACT=0xE76270B6caBe5Ad174506c6B3D841395c080795c
```

- `VITE_PRIVY_APP_ID`: App ID for this project.
- `VITE_RPC_URL`: RPC URL used for direct EIP-7702 / ERC-7821 transactions.
- `VITE_OPENFORT_CHAIN_ID`: Chain ID for Openfort 7702 flow (`84532` for Base Sepolia).
- `VITE_OPENFORT_IMPLEMENTATION_CONTRACT`: Openfort 7702 implementation contract.

## 3. Run locally

```bash
bun dev
```

## Notes

- The app throws at startup if `VITE_PRIVY_APP_ID` is missing.
- Openfort section uses direct onchain transactions (no bundler/paymaster).
- The signer EOA used for deployment/management must have native gas balance.

## Deploy Openfort OPF7702 on MegaETH testnet

1. Add one of these to `.env`:
   - `DEPLOYER_PRIVATE_KEY=0x...`
   - `OPENFORT_DEPLOYER_PRIVATE_KEY=0x...`
2. Ensure `VITE_RPC_URL` points to MegaETH testnet RPC (for example `https://carrot.megaeth.com/rpc`).
3. Run:

```bash
bun run deploy:openfort:megaeth
```

The script deploys:
- `WebAuthnVerifierV2`
- `GasPolicy`
- `OPF7702`

Then it updates `.env` with:
- `VITE_OPENFORT_IMPLEMENTATION_CONTRACT`
- `OPENFORT_WEBAUTHN_VERIFIER_ADDRESS`
- `OPENFORT_GAS_POLICY_ADDRESS`
- `VITE_OPENFORT_CHAIN_ID=6343`
