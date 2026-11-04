// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BoxChainToken} from "./BoxChainToken.sol";
import {IBoxChainModul} from "./IBoxChainModul.sol";
import {IBoxChainToken} from "./IBoxChainToken.sol";

contract BoxChainModul is IBoxChainModul {
    uint256 public constant INITIAL_BALANCE = 50 ether;
    uint256 public constant MATCH_TRANSFER = 5 ether;
    uint256 public constant WIN_REWARD = 1 ether;

    address public immutable boxToken;

    mapping(address boxer => bool) public override isRegistered;
    mapping(address boxer => bool) public override isCareerActive;
    mapping(address boxer => uint256) private _pendingMatches;

    struct MatchReport {
        address boxer1;
        address boxer2;
        MatchResult result1;
        MatchResult result2;
        bool hasFirstReport;
        bool completed;
    }

    mapping(uint256 matchId => MatchReport) private _matches;

    event BoxerRegistered(address indexed boxer);
    event MatchReported(
        uint256 indexed matchId,
        address indexed boxer,
        address indexed opponent,
        MatchResult result
    );
    event MatchConfirmed(
        uint256 indexed matchId,
        address indexed winner,
        address indexed loser,
        MatchResult result
    );
    event CareerEnded(address indexed boxer);
    event WalletRecovered(address indexed oldWallet, address indexed newWallet);

    constructor() {
        BoxChainToken token = new BoxChainToken(address(this));
        boxToken = address(token);
    }

    function registerBoxer() external override {
        require(!isRegistered[msg.sender], "Boxer already registered.");

        isRegistered[msg.sender] = true;
        isCareerActive[msg.sender] = true;
        IBoxChainToken(boxToken).mint(msg.sender, INITIAL_BALANCE);
        emit BoxerRegistered(msg.sender);
    }

    function reportMatch(
        uint256 matchId,
        address opponent,
        MatchResult result
    ) external override {
        require(isRegistered[msg.sender] && isRegistered[opponent], "Boxer is not registered.");
        require(isCareerActive[msg.sender] && isCareerActive[opponent], "Career is over.");
        require(msg.sender != opponent, "A boxer cannot compete against themselves.");

        MatchReport storage matchReport = _matches[matchId];
        if (!matchReport.hasFirstReport) {
            matchReport.boxer1 = msg.sender;
            matchReport.boxer2 = opponent;
            matchReport.result1 = result;
            matchReport.hasFirstReport = true;
            _pendingMatches[msg.sender] += 1;
            _pendingMatches[opponent] += 1;
            emit MatchReported(matchId, msg.sender, opponent, result);
            return;
        }

        require(!matchReport.completed, "Match has already been confirmed.");
        require(
            (matchReport.boxer1 == msg.sender && matchReport.boxer2 == opponent)
                || (matchReport.boxer1 == opponent && matchReport.boxer2 == msg.sender),
            "Match participants do not match."
        );
        require(msg.sender != matchReport.boxer1, "Boxer has already reported this match.");

        MatchResult firstResult = matchReport.result1;
        bool isWinLoss = (firstResult == MatchResult.Win && result == MatchResult.Loss)
            || (firstResult == MatchResult.Loss && result == MatchResult.Win);
        bool isDraw = firstResult == MatchResult.Draw && result == MatchResult.Draw;
        require(isWinLoss || isDraw, "Match result does not match the other participant's report.");

        matchReport.result2 = result;
        matchReport.completed = true;
        _pendingMatches[matchReport.boxer1] -= 1;
        _pendingMatches[matchReport.boxer2] -= 1;

        if (isDraw) {
            emit MatchConfirmed(matchId, address(0), address(0), MatchResult.Draw);
            return;
        }

        address winner = firstResult == MatchResult.Win ? matchReport.boxer1 : matchReport.boxer2;
        address loser = firstResult == MatchResult.Loss ? matchReport.boxer1 : matchReport.boxer2;
        uint256 transferAmount = IBoxChainToken(boxToken).balanceOf(loser);
        if (transferAmount > MATCH_TRANSFER) transferAmount = MATCH_TRANSFER;

        IBoxChainToken(boxToken).settleMatch(loser, winner, transferAmount);
        IBoxChainToken(boxToken).mint(winner, WIN_REWARD);

        if (IBoxChainToken(boxToken).balanceOf(loser) == 0) {
            isCareerActive[loser] = false;
            emit CareerEnded(loser);
        }

        emit MatchConfirmed(matchId, winner, loser, firstResult);
    }

    function recoverWallet(address newWallet) external override {
        require(isRegistered[msg.sender], "Only the current boxer wallet can authorize recovery.");
        require(newWallet != address(0), "New wallet cannot be the zero address.");
        require(newWallet != msg.sender, "New wallet must be different.");
        require(!isRegistered[newWallet], "New wallet is already registered.");
        require(_pendingMatches[msg.sender] == 0, "Cannot recover a wallet with pending matches.");

        bool careerActive = isCareerActive[msg.sender];
        isRegistered[msg.sender] = false;
        isCareerActive[msg.sender] = false;
        isRegistered[newWallet] = true;
        isCareerActive[newWallet] = careerActive;

        IBoxChainToken(boxToken).recoverBalance(msg.sender, newWallet);
        emit WalletRecovered(msg.sender, newWallet);
    }

    function getMatchStatus(
        uint256 matchId
    )
        external
        view
        override
        returns (
            bool exists,
            bool completed,
            address boxer1,
            address boxer2,
            MatchResult result1,
            MatchResult result2
        )
    {
        MatchReport storage matchReport = _matches[matchId];
        return (
            matchReport.hasFirstReport,
            matchReport.completed,
            matchReport.boxer1,
            matchReport.boxer2,
            matchReport.result1,
            matchReport.result2
        );
    }
}
