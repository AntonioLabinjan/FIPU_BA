import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const box = ethers.parseEther;

describe("BoxChainToken", function () {
  async function deployToken() {
    const [module, boxer, opponent, other] = await ethers.getSigners();
    const token = await ethers.deployContract("BoxChainToken", [module.address]);
    return { token, module, boxer, opponent, other };
  }

  it("uses the specified metadata and starts with zero supply", async function () {
    const { token } = await deployToken();

    expect(await token.name()).to.equal("BoxToken");
    expect(await token.symbol()).to.equal("BOX");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(0n);
  });

  it("rejects a zero module address", async function () {
    const factory = await ethers.getContractFactory("BoxChainToken");
    await expect(ethers.deployContract("BoxChainToken", [ethers.ZeroAddress]))
      .to.be.revertedWithCustomError(factory, "InvalidModuleAddress");
  });

  it("allows only the module to issue tokens", async function () {
    const { token, module, boxer, other } = await deployToken();

    await expect(token.connect(other).mint(boxer.address, box("50")))
      .to.be.revertedWithCustomError(token, "UnauthorizedModule");

    await expect(token.connect(module).mint(boxer.address, box("50")))
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, boxer.address, box("50"));
    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    expect(await token.totalSupply()).to.equal(box("50"));
  });

  it("rejects standalone token transfers", async function () {
    const { token, module, boxer, opponent } = await deployToken();
    await token.connect(module).mint(boxer.address, box("50"));

    await expect(token.connect(boxer).transfer(opponent.address, box("1")))
      .to.be.revertedWithCustomError(token, "StandaloneTransfersDisabled");
    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    expect(await token.balanceOf(opponent.address)).to.equal(0n);
  });

  it("allows approvals and exposes the allowance", async function () {
    const { token, boxer, module } = await deployToken();

    await expect(token.connect(boxer).approve(module.address, box("5")))
      .to.emit(token, "Approval")
      .withArgs(boxer.address, module.address, box("5"));
    expect(await token.allowance(boxer.address, module.address)).to.equal(box("5"));
  });

  it("restricts transferFrom to the module and enforces allowance", async function () {
    const { token, module, boxer, opponent, other } = await deployToken();
    await token.connect(module).mint(boxer.address, box("10"));

    await expect(token.connect(other).transferFrom(boxer.address, opponent.address, box("1")))
      .to.be.revertedWithCustomError(token, "UnauthorizedModule");
    await expect(token.connect(module).transferFrom(boxer.address, opponent.address, box("1")))
      .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
      .withArgs(module.address, 0n, box("1"));

    await token.connect(boxer).approve(module.address, box("2"));
    await expect(token.connect(module).transferFrom(boxer.address, opponent.address, box("2")))
      .to.emit(token, "Transfer")
      .withArgs(boxer.address, opponent.address, box("2"));
    expect(await token.balanceOf(boxer.address)).to.equal(box("8"));
  });

  it("allows only the module to settle a match", async function () {
    const { token, module, boxer, opponent, other } = await deployToken();
    await token.connect(module).mint(boxer.address, box("10"));

    await expect(token.connect(other).settleMatch(boxer.address, opponent.address, box("5")))
      .to.be.revertedWithCustomError(token, "UnauthorizedModule");
    await expect(token.connect(module).settleMatch(boxer.address, opponent.address, box("5")))
      .to.emit(token, "Transfer")
      .withArgs(boxer.address, opponent.address, box("5"));
    expect(await token.balanceOf(boxer.address)).to.equal(box("5"));
    expect(await token.balanceOf(opponent.address)).to.equal(box("5"));
    expect(await token.totalSupply()).to.equal(box("10"));
  });

  it("allows only the module to move the full balance during recovery", async function () {
    const { token, module, boxer, opponent, other } = await deployToken();
    await token.connect(module).mint(boxer.address, box("50"));

    await expect(token.connect(other).recoverBalance(boxer.address, opponent.address))
      .to.be.revertedWithCustomError(token, "UnauthorizedModule");
    await expect(token.connect(module).recoverBalance(boxer.address, opponent.address))
      .to.emit(token, "Transfer")
      .withArgs(boxer.address, opponent.address, box("50"));
    expect(await token.balanceOf(boxer.address)).to.equal(0n);
    expect(await token.balanceOf(opponent.address)).to.equal(box("50"));
  });
});
