import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const box = ethers.parseEther;
const Result = { Win: 0, Loss: 1, Draw: 2 };

describe("BoxChainModul", function () {
  async function deployModule() {
    const [boxer, opponent, other, newWallet] = await ethers.getSigners();
    const module = await ethers.deployContract("BoxChainModul");
    const token = await ethers.getContractAt("BoxChainToken", await module.boxToken());
    return { module, token, boxer, opponent, other, newWallet };
  }

  async function register(module, ...boxers) {
    for (const boxer of boxers) {
      await module.connect(boxer).registerBoxer();
    }
  }

  it("deploys its token and exposes the configured token metadata", async function () {
    const { module, token, other } = await deployModule();

    expect(await module.boxToken()).to.equal(await token.getAddress());
    expect(await token.name()).to.equal("BoxToken");
    expect(await token.symbol()).to.equal("BOX");
    expect(await token.decimals()).to.equal(18);
    expect(await module.isRegistered(other.address)).to.equal(false);
    expect(await module.isCareerActive(other.address)).to.equal(false);
    expect((await module.getMatchStatus(999)).exists).to.equal(false);
  });

  it("registers each wallet once and allocates 50 BOX", async function () {
    const { module, token, boxer } = await deployModule();

    await expect(module.connect(boxer).registerBoxer())
      .to.emit(module, "BoxerRegistered")
      .withArgs(boxer.address);
    expect(await module.isRegistered(boxer.address)).to.equal(true);
    expect(await module.isCareerActive(boxer.address)).to.equal(true);
    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    await expect(module.connect(boxer).registerBoxer())
      .to.be.revertedWith("Boxer already registered.");
  });

  it("settles a matching win and loss report and rewards the winner", async function () {
    const { module, token, boxer, opponent } = await deployModule();
    await register(module, boxer, opponent);

    await module.connect(boxer).reportMatch(1, opponent.address, Result.Win);
    const pending = await module.getMatchStatus(1);
    expect(pending.exists).to.equal(true);
    expect(pending.completed).to.equal(false);

    await expect(module.connect(opponent).reportMatch(1, boxer.address, Result.Loss))
      .to.emit(module, "MatchConfirmed")
      .withArgs(1, boxer.address, opponent.address, Result.Win);
    expect(await token.balanceOf(boxer.address)).to.equal(box("56"));
    expect(await token.balanceOf(opponent.address)).to.equal(box("45"));
    expect(await token.totalSupply()).to.equal(box("101"));
    expect((await module.getMatchStatus(1)).completed).to.equal(true);
  });

  it("confirms a draw without changing either balance", async function () {
    const { module, token, boxer, opponent } = await deployModule();
    await register(module, boxer, opponent);

    await module.connect(boxer).reportMatch(2, opponent.address, Result.Draw);
    await expect(module.connect(opponent).reportMatch(2, boxer.address, Result.Draw))
      .to.emit(module, "MatchConfirmed")
      .withArgs(2, ethers.ZeroAddress, ethers.ZeroAddress, Result.Draw);
    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    expect(await token.balanceOf(opponent.address)).to.equal(box("50"));
  });

  it("rejects unregistered participants and self-matches", async function () {
    const { module, boxer, opponent, other } = await deployModule();
    await register(module, boxer, opponent);

    await expect(module.connect(boxer).reportMatch(3, other.address, Result.Win))
      .to.be.revertedWith("Boxer is not registered.");
    await expect(module.connect(boxer).reportMatch(3, boxer.address, Result.Win))
      .to.be.revertedWith("A boxer cannot compete against themselves.");
    await expect(module.connect(other).reportMatch(3, boxer.address, Result.Loss))
      .to.be.revertedWith("Boxer is not registered.");
  });

  it("rejects mismatched results, participants, and duplicate reports", async function () {
    const { module, boxer, opponent, other } = await deployModule();
    await register(module, boxer, opponent, other);

    await module.connect(boxer).reportMatch(4, opponent.address, Result.Win);
    await expect(module.connect(opponent).reportMatch(4, boxer.address, Result.Draw))
      .to.be.revertedWith("Match result does not match the other participant's report.");
    await expect(module.connect(other).reportMatch(4, boxer.address, Result.Loss))
      .to.be.revertedWith("Match participants do not match.");
    await expect(module.connect(boxer).reportMatch(4, opponent.address, Result.Win))
      .to.be.revertedWith("Boxer has already reported this match.");
  });

  it("settles a balance below 5 BOX and ends the career when the balance reaches zero", async function () {
    const { module, token } = await deployModule();
    const signers = await ethers.getSigners();
    const [boxer, ...opponents] = signers.slice(0, 13);
    await register(module, boxer, ...opponents);

    await module.connect(boxer).reportMatch(10, opponents[0].address, Result.Win);
    await module.connect(opponents[0]).reportMatch(10, boxer.address, Result.Loss);
    for (let index = 1; index <= 11; index += 1) {
      const matchId = 10 + index;
      await module.connect(boxer).reportMatch(matchId, opponents[index].address, Result.Loss);
      await module.connect(opponents[index]).reportMatch(matchId, boxer.address, Result.Win);
    }

    expect(await token.balanceOf(boxer.address)).to.equal(box("1"));
    expect(await module.isCareerActive(boxer.address)).to.equal(true);
    await module.connect(boxer).reportMatch(22, opponents[0].address, Result.Loss);
    await module.connect(opponents[0]).reportMatch(22, boxer.address, Result.Win);

    expect(await token.balanceOf(boxer.address)).to.equal(0n);
    expect(await token.balanceOf(opponents[0].address)).to.equal(box("47"));
    expect(await module.isCareerActive(boxer.address)).to.equal(false);
    await expect(module.connect(boxer).reportMatch(23, opponents[1].address, Result.Win))
      .to.be.revertedWith("Career is over.");
  });

  it("moves registration, career status, and token balance to a new wallet", async function () {
    const { module, token, boxer, newWallet } = await deployModule();
    await register(module, boxer);

    await expect(module.connect(boxer).recoverWallet(newWallet.address))
      .to.emit(module, "WalletRecovered")
      .withArgs(boxer.address, newWallet.address);
    expect(await module.isRegistered(boxer.address)).to.equal(false);
    expect(await module.isRegistered(newWallet.address)).to.equal(true);
    expect(await module.isCareerActive(newWallet.address)).to.equal(true);
    expect(await token.balanceOf(boxer.address)).to.equal(0n);
    expect(await token.balanceOf(newWallet.address)).to.equal(box("50"));
  });

  it("requires the registered wallet and a new, unused destination for recovery", async function () {
    const { module, boxer, opponent, other, newWallet } = await deployModule();
    await register(module, boxer, opponent);

    await expect(module.connect(other).recoverWallet(newWallet.address))
      .to.be.revertedWith("Only the current boxer wallet can authorize recovery.");
    await expect(module.connect(boxer).recoverWallet(ethers.ZeroAddress))
      .to.be.revertedWith("New wallet cannot be the zero address.");
    await expect(module.connect(boxer).recoverWallet(boxer.address))
      .to.be.revertedWith("New wallet must be different.");
    await expect(module.connect(boxer).recoverWallet(opponent.address))
      .to.be.revertedWith("New wallet is already registered.");
  });

  it("requires pending match reports to be resolved before wallet recovery", async function () {
    const { module, boxer, opponent, newWallet } = await deployModule();
    await register(module, boxer, opponent);

    await module.connect(boxer).reportMatch(30, opponent.address, Result.Draw);
    await expect(module.connect(boxer).recoverWallet(newWallet.address))
      .to.be.revertedWith("Cannot recover a wallet with pending matches.");

    await module.connect(opponent).reportMatch(30, boxer.address, Result.Draw);
    await module.connect(boxer).recoverWallet(newWallet.address);
    expect(await module.isRegistered(newWallet.address)).to.equal(true);
  });
});
