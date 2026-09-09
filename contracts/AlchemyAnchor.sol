// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/// @title AlchemyAnchor (Robinhood Chain)
/// @notice Payrail recorder. Transfers already-held ERC-20 / ETH after a MoonPay UUID hash is confirmed.
///         Does not mint USDC, BTC, SOL, XLM, or ETH. BTC/SOL/XLM hops are events only on this chain.
contract AlchemyAnchor {
    address public admin;
    mapping(bytes32 => bool) public moonpayConfirmed;
    mapping(bytes32 => bool) public hops;

    event MoonPayConfirmed(bytes32 indexed uuidHash);
    event Hop(bytes32 indexed id, string asset, uint256 amount, address dest);
    event Disbursed(bytes32 indexed uuidHash, address token, address dest, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function confirmMoonPay(bytes32 uuidHash) external onlyAdmin {
        require(uuidHash != bytes32(0), "uuid");
        moonpayConfirmed[uuidHash] = true;
        emit MoonPayConfirmed(uuidHash);
    }

    /// Transfer held ERC-20. token = address(0) sends ETH. Never mints.
    function disburse(
        bytes32 uuidHash,
        address token,
        address payable dest,
        uint256 amount
    ) external onlyAdmin {
        require(moonpayConfirmed[uuidHash], "await moonpay uuid");
        require(dest != address(0) && amount > 0, "args");
        if (token == address(0)) {
            (bool ok, ) = dest.call{value: amount}("");
            require(ok, "eth");
        } else {
            (bool ok, bytes memory data) = token.call(
                abi.encodeWithSelector(0xa9059cbb, dest, amount)
            );
            require(ok && (data.length == 0 || abi.decode(data, (bool))), "erc20");
        }
        emit Disbursed(uuidHash, token, dest, amount);
    }

    /// Record a BTC/SOL/XLM/USDC/ETH hop intent. Actual move is the interchainer + payrails.
    function recordHop(
        bytes32 id,
        string calldata asset,
        uint256 amount,
        address dest
    ) external onlyAdmin {
        hops[id] = true;
        emit Hop(id, asset, amount, dest);
    }

    receive() external payable {}
}
