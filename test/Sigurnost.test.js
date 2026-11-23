import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const box = ethers.parseEther;
const Result = { Win: 0, Loss: 1, Draw: 2 };
const MATCH_REPORT_TIMEOUT = 7 * 24 * 60 * 60;

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

  it("S3: an unsolicited report cannot block the opponent's recovery", async function () {
    const [attacker, victim, other, opponent, newWallet, attackerNewWallet] = accounts;
    for (const boxer of [attacker, victim, other, opponent]) {
      await module.connect(boxer).registerBoxer();
    }

    await module.connect(attacker).reportMatch(90, victim.address, Result.Win);
    await expect(module.connect(attacker).recoverWallet(attackerNewWallet.address))
      .to.be.revertedWith("Cannot recover a wallet with pending matches.");
    await expect(module.connect(other).reportMatch(90, opponent.address, Result.Draw))
      .to.be.revertedWith("Match participants do not match.");
    await expect(module.connect(victim).recoverWallet(newWallet.address))
      .to.emit(module, "WalletRecovered")
      .withArgs(victim.address, newWallet.address);
    await expect(module.connect(newWallet).reportMatch(90, attacker.address, Result.Loss))
      .to.be.revertedWith("Match participants do not match.");

    expect(await token.balanceOf(attacker.address)).to.equal(box("50"));
    expect(await token.balanceOf(victim.address)).to.equal(0n);
    expect(await token.balanceOf(newWallet.address)).to.equal(box("50"));
    expect(await token.totalSupply()).to.equal(box("200"));

    await ethers.provider.send("evm_increaseTime", [MATCH_REPORT_TIMEOUT]);
    await ethers.provider.send("evm_mine", []);

    await expect(module.connect(attackerNewWallet).expireMatch(90))
      .to.emit(module, "MatchExpired")
      .withArgs(90, attacker.address, victim.address);

    expect((await module.getMatchStatus(90)).exists).to.equal(false);
    expect(await token.balanceOf(attacker.address)).to.equal(box("50"));
    expect(await token.balanceOf(victim.address)).to.equal(0n);
    expect(await token.totalSupply()).to.equal(box("200"));

    await module.connect(attacker).recoverWallet(attackerNewWallet.address);
    expect(await token.balanceOf(attackerNewWallet.address)).to.equal(box("50"));

    await module.connect(other).reportMatch(90, opponent.address, Result.Draw);
    await module.connect(opponent).reportMatch(90, other.address, Result.Draw);
    expect((await module.getMatchStatus(90)).completed).to.equal(true);
  });

  it("S4: only an expired pending match can be cancelled", async function () {
    const [boxer, opponent, caller] = accounts;
    expect(await module.MATCH_REPORT_TIMEOUT()).to.equal(MATCH_REPORT_TIMEOUT);
    await module.connect(boxer).registerBoxer();
    await module.connect(opponent).registerBoxer();
    await module.connect(caller).registerBoxer();

    await expect(module.connect(caller).expireMatch(999))
      .to.be.revertedWith("Match does not exist.");

    await module.connect(boxer).reportMatch(91, opponent.address, Result.Draw);
    await expect(module.connect(caller).expireMatch(91))
      .to.be.revertedWith("Match report has not expired.");

    await module.connect(opponent).reportMatch(91, boxer.address, Result.Draw);
    await ethers.provider.send("evm_increaseTime", [MATCH_REPORT_TIMEOUT]);
    await ethers.provider.send("evm_mine", []);

    await expect(module.connect(caller).expireMatch(91))
      .to.be.revertedWith("Match has already been confirmed.");
    await expect(module.connect(caller).reportMatch(91, boxer.address, Result.Win))
      .to.be.revertedWith("Match has already been confirmed.");
  });

  it("S5: a recovered wallet cannot start or receive another career", async function () {
    const [oldWallet, newWallet] = accounts;
    await module.connect(oldWallet).registerBoxer();
    await module.connect(oldWallet).recoverWallet(newWallet.address);

    await expect(module.connect(oldWallet).registerBoxer())
      .to.be.revertedWith("Boxer wallet has already been used.");
    await expect(module.connect(newWallet).recoverWallet(oldWallet.address))
      .to.be.revertedWith("New wallet has already been used.");

    expect(await token.balanceOf(oldWallet.address)).to.equal(0n);
    expect(await token.balanceOf(newWallet.address)).to.equal(box("50"));
    expect(await token.totalSupply()).to.equal(box("50"));
  });
});
