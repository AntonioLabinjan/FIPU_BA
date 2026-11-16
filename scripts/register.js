import { network } from "hardhat";

const moduleAddress = process.env.MODULE_ADDRESS;

if (!moduleAddress || !/^0x[0-9a-fA-F]{40}$/.test(moduleAddress)) {
  throw new Error("Set MODULE_ADDRESS to the deployed BoxChainModul address.");
}

const { ethers } = await network.connect();
const [boxer] = await ethers.getSigners();
const module = await ethers.getContractAt("BoxChainModul", moduleAddress);
const transaction = await module.connect(boxer).registerBoxer();
const receipt = await transaction.wait();

console.log("Boksač registriran:", boxer.address);
console.log("Transaction:", receipt.hash);
console.log("Gas used:", receipt.gasUsed.toString());
