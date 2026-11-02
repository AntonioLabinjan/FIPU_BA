// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBoxChainModul {
    enum MatchResult {
        Win,
        Loss,
        Draw
    }

    // Role: An unregistered wallet; SPEC: K1, K2.
    function registerBoxer() external;

    // Role: A registered boxer with an active career who participates in the match.
    // SPEC: K3, K4, K5, K6, K7, K8.
    function reportMatch(uint256 matchId, address opponent, MatchResult result) external;

    // Role: The current boxer wallet; SPEC: K9, K10.
    function recoverWallet(address newWallet) external;

    // Role: Public; SPEC: K1, K2, K8.
    function isRegistered(address boxer) external view returns (bool);

    // Role: Public; SPEC: K7.
    function isCareerActive(address boxer) external view returns (bool);
}
