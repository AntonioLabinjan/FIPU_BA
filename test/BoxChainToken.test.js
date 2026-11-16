import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();
const box = ethers.parseEther;
const Result = { Win: 0, Loss: 1, Draw: 2 };

describe("BoxChainToken acceptance criteria", function () {
  let module;
  let token;
  let accounts;

  beforeEach(async function () {
    accounts = await ethers.getSigners();
    module = await ethers.deployContract("BoxChainModul");
    token = await ethers.getContractAt("BoxChainToken", await module.boxToken());
  });

  async function registerBoxers(...boxers) {
    for (const boxer of boxers) {
      await module.connect(boxer).registerBoxer();
    }
  }

  async function confirmMatch(matchId, boxer, opponent, boxerResult, opponentResult) {
    await module.connect(boxer).reportMatch(matchId, opponent.address, boxerResult);
    await module.connect(opponent).reportMatch(matchId, boxer.address, opponentResult);
  }

  it("K1: registering a boxer allocates 50 BOX", async function () {
    const [boxer] = accounts;

    await expect(module.connect(boxer).registerBoxer())
      .to.emit(module, "BoxerRegistered")
      .withArgs(boxer.address);

    expect(await module.isRegistered(boxer.address)).to.equal(true);
    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
  });

  // definiramo 1 test s točnim nazivom kriterija iz SPECS
  it("K2: rejects registering the same boxer twice", async function () {
    // uzimamo prvi testni račun...isto kao da imamo accounts[0] i da ga zovemo boxer
    const [boxer] = accounts;
    // postavi stanje kao da je taj račun već registriran => poziv funkcije za registraciju
    await registerBoxers(boxer);
    // pokušaj registracije istog računa ponovno i očekuj da se transakcija odbije s točnom porukom
    await expect(module.connect(boxer).registerBoxer())
      .to.be.revertedWith("Boxer already registered.");
  });

  it("K3: confirms a win and loss, transfers 5 BOX, and rewards the winner 1 BOX", async function () {
    const [winner, loser] = accounts;
    await registerBoxers(winner, loser);

    await module.connect(winner).reportMatch(1, loser.address, Result.Win);
    await expect(module.connect(loser).reportMatch(1, winner.address, Result.Loss))
      .to.emit(module, "MatchConfirmed")
      .withArgs(1, winner.address, loser.address, Result.Win);

    expect((await module.getMatchStatus(1)).completed).to.equal(true);
    expect(await token.balanceOf(winner.address)).to.equal(box("56"));
    expect(await token.balanceOf(loser.address)).to.equal(box("45"));
    expect(await token.totalSupply()).to.equal(box("101"));
  });

  it("K4: transfers the loser's remaining balance when it is below 5 BOX", async function () {
    const [boxer, firstOpponent, ...opponents] = accounts;
    await registerBoxers(boxer, firstOpponent, ...opponents.slice(0, 11));

    await confirmMatch(1, boxer, firstOpponent, Result.Win, Result.Loss);
    for (let index = 0; index < 11; index += 1) {
      await confirmMatch(index + 2, boxer, opponents[index], Result.Loss, Result.Win);
    }
    expect(await token.balanceOf(boxer.address)).to.equal(box("1"));
    await module.connect(boxer).reportMatch(13, firstOpponent.address, Result.Loss);

    await expect(
      module.connect(firstOpponent).reportMatch(13, boxer.address, Result.Win),
    )
      .to.emit(module, "MatchConfirmed")
      .withArgs(13, firstOpponent.address, boxer.address, Result.Loss)
      .and.to.emit(module, "CareerEnded")
      .withArgs(boxer.address);

    expect(await token.balanceOf(boxer.address)).to.equal(0n);
    expect(await module.isCareerActive(boxer.address)).to.equal(false);
  });

  it("K5: confirms a draw without changing either balance", async function () {
    const [boxer, opponent] = accounts;
    await registerBoxers(boxer, opponent);

    await module.connect(boxer).reportMatch(1, opponent.address, Result.Draw);
    await expect(module.connect(opponent).reportMatch(1, boxer.address, Result.Draw))
      .to.emit(module, "MatchConfirmed")
      .withArgs(1, ethers.ZeroAddress, ethers.ZeroAddress, Result.Draw);

    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    expect(await token.balanceOf(opponent.address)).to.equal(box("50"));
  });

  it("K6: rejects results that do not match the first report", async function () {
    const [boxer, opponent] = accounts;
    await registerBoxers(boxer, opponent);
    await module.connect(boxer).reportMatch(1, opponent.address, Result.Win);

    await expect(module.connect(opponent).reportMatch(1, boxer.address, Result.Draw))
      .to.be.revertedWith("Match result does not match the other participant's report.");
  });

  it("K7: rejects a match report from a boxer whose career has ended", async function () {
    const [boxer, ...opponents] = accounts;
    await registerBoxers(boxer, ...opponents.slice(0, 10));

    for (let index = 0; index < 10; index += 1) {
      await confirmMatch(index + 1, boxer, opponents[index], Result.Loss, Result.Win);
    }
    expect(await module.isCareerActive(boxer.address)).to.equal(false);

    await expect(
      module.connect(boxer).reportMatch(11, opponents[0].address, Result.Win),
    ).to.be.revertedWith("Career is over.");
  });

  it("K8: rejects match reports involving an unregistered boxer", async function () {
    const [boxer, unregistered] = accounts;
    await registerBoxers(boxer);

    await expect(
      module.connect(boxer).reportMatch(1, unregistered.address, Result.Win),
    ).to.be.revertedWith("Boxer is not registered.");
  });

  it("K9: recovers registration, career status, and balance to a new wallet", async function () {
    const [oldWallet, newWallet] = accounts;
    await registerBoxers(oldWallet);

    await expect(module.connect(oldWallet).recoverWallet(newWallet.address))
      .to.emit(module, "WalletRecovered")
      .withArgs(oldWallet.address, newWallet.address);

    expect(await module.isRegistered(oldWallet.address)).to.equal(false);
    expect(await module.isRegistered(newWallet.address)).to.equal(true);
    expect(await module.isCareerActive(newWallet.address)).to.equal(true);
    expect(await token.balanceOf(oldWallet.address)).to.equal(0n);
    expect(await token.balanceOf(newWallet.address)).to.equal(box("50"));
  });

  it("K10: rejects wallet recovery not authorized by the current wallet", async function () {
    const [oldWallet, newWallet, unauthorizedWallet] = accounts;
    await registerBoxers(oldWallet);

    await expect(
      module.connect(unauthorizedWallet).recoverWallet(newWallet.address),
    ).to.be.revertedWith("Only the current boxer wallet can authorize recovery.");
  });

  it("K11: exposes the boxer's current balance and career status", async function () {
    const [boxer, ...opponents] = accounts;
    await registerBoxers(boxer, ...opponents.slice(0, 10));

    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    expect(await module.isCareerActive(boxer.address)).to.equal(true);

    for (let index = 0; index < 10; index += 1) {
      await confirmMatch(index + 1, boxer, opponents[index], Result.Loss, Result.Win);
    }

    expect(await token.balanceOf(boxer.address)).to.equal(0n);
    expect(await module.isCareerActive(boxer.address)).to.equal(false);
  });

  it("K12: rejects standalone token transfers and leaves balances unchanged", async function () {
    const [boxer, opponent] = accounts;
    await registerBoxers(boxer, opponent);

    await expect(token.connect(boxer).transfer(opponent.address, box("1")))
      .to.be.revertedWithCustomError(token, "StandaloneTransfersDisabled");
    await expect(token.connect(boxer).transferFrom(boxer.address, opponent.address, box("1")))
      .to.be.revertedWithCustomError(token, "UnauthorizedModule");

    expect(await token.balanceOf(boxer.address)).to.equal(box("50"));
    expect(await token.balanceOf(opponent.address)).to.equal(box("50"));
  });

  it("K13: returns the specified token metadata", async function () {
    expect(await token.name()).to.equal("BoxToken");
    expect(await token.symbol()).to.equal("BOX");
    expect(await token.decimals()).to.equal(18);
  });
});
