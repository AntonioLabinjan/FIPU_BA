// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBoxChainToken {
    // Emitted when tokens move, including issuance and match/recovery settlement.
    event Transfer(address indexed from, address indexed to, uint256 value);

    // Emitted when a token holder changes an allowance.
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Role: Public; SPEC: Odluke o tokenu (name).
    function name() external view returns (string memory);

    // Role: Public; SPEC: Odluke o tokenu (symbol).
    function symbol() external view returns (string memory);

    // Role: Public; SPEC: Odluke o tokenu (decimals).
    function decimals() external view returns (uint8);

    // Role: Public; SPEC: K1, K3, K4.
    function totalSupply() external view returns (uint256);

    // Role: Public; SPEC: K1, K3, K4.
    function balanceOf(address account) external view returns (uint256);

    // Role: Public; SPEC: ERC-20 API odabran za ovo sučelje.
    function allowance(address owner, address spender) external view returns (uint256);

    // Role: Token holder; standalone transfers are forbidden by SPEC.
    // SPEC: Odluke o tokenu, Matrica ovlasti.
    function transfer(address to, uint256 value) external returns (bool);

    // Role: Token holder; SPEC does not define an allowance-based match flow.
    // SPEC: ERC-20 API odabran za ovo sučelje.
    function approve(address spender, uint256 value) external returns (bool);

    // Role: BoxChainModul only for confirmed match settlement; SPEC: K3, K4.
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    // Role: BoxChainModul only; used for initial allocation and victory rewards.
    // No administrator or manual issuance; SPEC: K1, K3.
    function mint(address to, uint256 value) external;

    // Role: BoxChainModul only; SPEC: K3, K4.
    function settleMatch(address from, address to, uint256 value) external;

    // Role: BoxChainModul only, during wallet recovery authorized by the old wallet.
    // This is the explicitly approved recovery exception to the transfer restriction.
    function recoverBalance(address from, address to) external;
}
