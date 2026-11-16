import { network } from "hardhat";

const { ethers } = await network.connect();
const [deployer] = await ethers.getSigners();

const module = await ethers.deployContract("BoxChainModul");
await module.waitForDeployment();

const tokenAddress = await module.boxToken();

console.log("Modul objavljen na adresi:", await module.getAddress());
console.log("Token objavljen na adresi:", tokenAddress);
console.log("Deployer:", deployer.address);
