import { network } from "hardhat";

const accountAddress = (process.env.ACCOUNT_ADDRESS || "").trim();

if (!/^0x[0-9a-fA-F]{40}$/.test(accountAddress)) {
  throw new Error("Set ACCOUNT_ADDRESS to the MetaMask address to fund on the local network.");
}

const { ethers } = await network.connect();
const { chainId } = await ethers.provider.getNetwork();

if (chainId !== 31337n) {
  throw new Error("This script only funds accounts on the local Hardhat network (chain ID 31337).");
}

const [funder] = await ethers.getSigners();
const transaction = await funder.sendTransaction({
  to: accountAddress,
  value: ethers.parseEther("10"),
});
const receipt = await transaction.wait();

console.log("Funded local account:", accountAddress);
console.log("Transaction:", receipt.hash);
console.log("Gas used:", receipt.gasUsed.toString());
