// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IBoxChainToken} from "./IBoxChainToken.sol";

contract BoxChainToken is ERC20, IBoxChainToken {
    error UnauthorizedModule();
    error StandaloneTransfersDisabled();
    error InvalidModuleAddress();

    address private immutable _module;

    modifier onlyModule() {
        if (msg.sender != _module) revert UnauthorizedModule();
        _;
    }

    // Role: Deployer; fixes the sole module address for this token instance.
    // SPEC: No administrator or manual issuance; module-only token operations.
    constructor(address moduleAddress) ERC20("BoxToken", "BOX") {
        if (moduleAddress == address(0)) revert InvalidModuleAddress();
        _module = moduleAddress;
    }

    // Role: Public; SPEC: K13.
    function name() public view override(ERC20, IERC20Metadata) returns (string memory) {
        return super.name();
    }

    // Role: Public; SPEC: K13.
    function symbol() public view override(ERC20, IERC20Metadata) returns (string memory) {
        return super.symbol();
    }

    // Role: Public; SPEC: K13.
    function decimals() public pure override(ERC20, IERC20Metadata) returns (uint8) {
        return 18;
    }

    // Role: Public; SPEC: K1, K3, K4.
    function totalSupply() public view override(ERC20, IERC20) returns (uint256) {
        return super.totalSupply();
    }

    // Role: Public; SPEC: K1, K3, K4, K11.
    function balanceOf(address account) public view override(ERC20, IERC20) returns (uint256) {
        return super.balanceOf(account);
    }

    // Role: Public; SPEC: ERC-20 allowance API.
    function allowance(address owner, address spender) public view override(ERC20, IERC20) returns (uint256) {
        return super.allowance(owner, spender);
    }

    // Role: Token holder; standalone transfers are forbidden; SPEC: K12.
    function transfer(address, uint256) public pure override(ERC20, IERC20) returns (bool) {
        revert StandaloneTransfersDisabled();
    }

    // Role: Token holder; approval alone does not transfer tokens; SPEC: ERC-20 approval API, K12.
    function approve(address spender, uint256 value) public override(ERC20, IERC20) returns (bool) {
        return super.approve(spender, value);
    }

    // Role: BoxChainModul only; SPEC: K3, K4, K12.
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override(ERC20, IBoxChainToken) onlyModule returns (bool) {
        return super.transferFrom(from, to, value);
    }

    // Role: BoxChainModul only; SPEC: K1, K3.
    function mint(address to, uint256 value) external override onlyModule {
        _mint(to, value);
    }

    // Role: BoxChainModul only; SPEC: K3, K4.
    function settleMatch(address from, address to, uint256 value) external override onlyModule {
        _transfer(from, to, value);
    }

    // Role: BoxChainModul only after the old wallet authorizes recovery; SPEC: K9, K10.
    function recoverBalance(address from, address to) external override onlyModule {
        _transfer(from, to, balanceOf(from));
    }
}
