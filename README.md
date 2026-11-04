# BoxChain

BoxChain tracks on-chain boxing careers on Sepolia. Boxers register their wallets, report match outcomes with their opponents, and view their BOX score and career status.

## Stack

- Vue 3, Pinia, and Vite in `frontend/`
- ethers v6 with the MetaMask provider
- Solidity `^0.8.24` and OpenZeppelin Contracts 5.x
- Hardhat 3 with Mocha and ethers
- Sepolia (chain ID `11155111`)

## Contract behavior

`BoxChainModul` deploys and owns its `BoxChainToken`. Registering a wallet allocates 50 BOX. A match affects balances only after both registered boxers report complementary results; a win transfers up to 5 BOX from the loser and mints 1 BOX for the winner. Draws do not change balances. Wallet recovery requires approval from the current wallet and no unresolved match reports.

## Configure and run the frontend

Run the frontend and connect MetaMask on Sepolia. If no module address is configured, the app offers a **Deploy contracts** action. Review and approve the transaction in MetaMask; your connected wallet pays Sepolia gas. The deployment creates `BoxChainModul` and its `BoxChainToken`.

The confirmed module address is saved in that browser. To configure it explicitly (for example, in another browser), copy `frontend/.env.example` to `frontend/.env.local` and set the deployed address:

```dotenv
VITE_BOXCHAIN_MODULE_ADDRESS=0xYourDeployedModuleAddress
```

The app reads the BoxToken address from the module contract. It never needs a private key or a separately configured token address. Use MetaMask on Sepolia and fund it with Sepolia ETH for transaction fees.

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Build the frontend with:

```bash
npm --prefix frontend run build
```

Run the contract tests from the repository root with:

```bash
npm test
```
