import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const box = ethers.parseEther;

describe("Sigurnost", function () {
  let module;
  let token;
  let accounts;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    module = await ethers.deployContract("BoxChainModul");
    token = await ethers.getContractAt("BoxChainToken", await module.boxToken());
  });

  it("S1: a non-module cannot issue tokens", async function () {
    const [boxer, attacker] = accounts;

    await expect(token.connect(attacker).mint(boxer.address, box("50")))
      .to.be.revertedWithCustomError(token, "UnauthorizedModule");

    expect(await token.balanceOf(boxer.address)).to.equal(0n);
    expect(await token.totalSupply()).to.equal(0n);
  });

  it("S2: a boxer cannot transfer tokens outside match settlement", async function () {
    const [boxer, opponent, attacker] = accounts;
    await module.connect(boxer).registerBoxer();
    await module.connect(opponent).registerBoxer();
    await token.connect(boxer).approve(attacker.address, box("1"));

    await expect(token.connect(boxer).transfer(opponent.address, box("1")))
      .to.be.revertedWithCustomError(token, "StandaloneTransfersDisabled");
    await expect(
      token.connect(attacker).transferFrom(boxer.address, opponent.address, box("1")),
    ).to.be.revertedWithCustomError(token, "UnauthorizedModule");

    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    expect(await token.balanceOf(opponent.address)).to.equal(box("50"));
  });
});
