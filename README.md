# BoxChain

BoxChain tracks on-chain boxing careers on Sepolia. Boxers register their wallets, report match outcomes with their opponents, and view their BOX score and career status.

## Stack

- Vue 3, Pinia, and Vite in `frontend/`
- ethers v6 with the MetaMask provider
- Solidity `^0.8.24` and OpenZeppelin Contracts 5.x
- Hardhat 3 with Mocha and ethers
- Sepolia (chain ID `11155111`) and local Hardhat (chain ID `31337`)

## Contract behavior

`BoxChainModul` deploys and owns its `BoxChainToken`. Registering a wallet allocates 50 BOX. A match affects balances only after both registered boxers report complementary results; a win transfers up to 5 BOX from the loser and mints 1 BOX for the winner. Draws do not change balances. Wallet recovery requires approval from the current wallet and no unresolved match reports.

## Configure and run the frontend

Run the frontend and connect MetaMask on Sepolia or Local Hardhat. If no module address is configured on the selected network, the app offers a **Deploy contracts** action. Review and approve the transaction in MetaMask; the connected wallet pays the network's transaction fees. The deployment creates `BoxChainModul` and its `BoxChainToken`.

The confirmed module address is saved in that browser separately for each network. To configure the Sepolia address explicitly (for example, in another browser), copy `frontend/.env.example` to `frontend/.env.local` and set the deployed address:

```dotenv
VITE_BOXCHAIN_MODULE_ADDRESS=0xYourDeployedModuleAddress
```

The app reads the BoxToken address from the module contract. It never needs a private key or a separately configured token address. Use MetaMask on Sepolia and fund it with Sepolia ETH for transaction fees.

## Local end-to-end testing

1. Start the local Hardhat blockchain:

   ```bash
   npx hardhat node
   ```

2. In another terminal, start Vue:

   ```bash
   npm --prefix frontend run dev
   ```

3. Open the frontend, connect MetaMask, and choose **Local Hardhat**. The app adds the local network to MetaMask if needed (`http://127.0.0.1:8545`, chain ID `31337`).
4. Fund the connected public wallet address with local test ETH. Replace the address with the one displayed in the app:

   ```bash
   ACCOUNT_ADDRESS=0xYourMetaMaskAddress npx hardhat run scripts/fund-local-account.js --network localhost
   ```

   This helper sends 10 test ETH from a local Hardhat account and refuses to run on any other chain. It does not need or handle wallet private keys. Run it for each MetaMask account used in the test.
5. In the app, deploy the contracts, register two accounts, and submit matching reports for a match. Switch MetaMask accounts to submit each participant's report; inspect the updated BOX balances in the app.

If you stop and restart `npx hardhat node`, its local chain state is reset. Clear the saved local deployment in the app and deploy again.

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
