// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IBoxChainToken is IERC20Metadata {
    // Role: BoxChainModul only for confirmed match settlement; SPEC: K3, K4.
    function transferFrom(address from, address to, uint256 value) external override returns (bool);

    // Role: BoxChainModul only; used for initial allocation and victory rewards.
    // No administrator or manual issuance; SPEC: K1, K3.
    function mint(address to, uint256 value) external;

    // Role: BoxChainModul only; SPEC: K3, K4.
    function settleMatch(address from, address to, uint256 value) external;

    // Role: BoxChainModul only, during wallet recovery authorized by the old wallet.
    // This is the explicitly approved recovery exception to the transfer restriction.
    function recoverBalance(address from, address to) external;
}
