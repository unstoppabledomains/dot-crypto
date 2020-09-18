pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import "./BulkWhitelistedRole.sol";
import "../controllers/IMintingController.sol";
import "../controllers/MintingController.sol";
import "../Registry.sol";
import "../Resolver.sol";

/**
 * @title WhitelistedMinter
 * @dev Defines the functions for distribution of Second Level Domains (SLD)s.
 */
contract WhitelistedMinter is IMintingController, BulkWhitelistedRole {
    using ECDSA for bytes32;

    string public constant NAME = 'Unstoppable Whitelisted Minter';
    string public constant VERSION = '0.2.0';

    MintingController internal _mintingController;
    Resolver internal _resolver;
    Registry internal _registry;

    constructor(MintingController mintingController) public {
        _mintingController = mintingController;
        _registry = Registry(mintingController.registry());
    }

    function renounceMinter() external onlyWhitelistAdmin {
        _mintingController.renounceMinter();
    }

    /**
     * Renounce whitelisted account with funds' forwarding
     */
    function closeWhitelisted(address payable receiver)
        external
        payable
        onlyWhitelisted
    {
        require(receiver != address(0x0), "WhitelistedMinter: RECEIVER_IS_EMPTY");

        renounceWhitelisted();
        receiver.transfer(msg.value);
    }

    /**
     * Replace whitelisted account by new account with funds' forwarding
     */
    function rotateWhitelisted(address payable receiver)
        external
        payable
        onlyWhitelisted
    {
        require(receiver != address(0x0), "WhitelistedMinter: RECEIVER_IS_EMPTY");

        _addWhitelisted(receiver);
        renounceWhitelisted();
        receiver.transfer(msg.value);
    }

    function mintSLD(address to, string calldata label)
        external
        onlyWhitelisted
    {
        _mintingController.mintSLD(to, label);
    }

    function mintSLDFor(address to, string calldata label, bytes calldata signature) external {
        bytes4 selector = bytes4(keccak256('mintSLD(address,string)'));
        verifySigner(keccak256(abi.encodeWithSelector(selector, to, label)), signature);
        _mintingController.mintSLD(to, label);
    }

    function safeMintSLD(address to, string calldata label)
        external
        onlyWhitelisted
    {
        _mintingController.safeMintSLD(to, label);
    }

    function safeMintSLD(
        address to,
        string calldata label,
        bytes calldata _data
    ) external onlyWhitelisted {
        _mintingController.safeMintSLD(to, label, _data);
    }

    function mintSLDToDefaultResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values
    ) public onlyWhitelisted {
        mintSLDToResolver(to, label, keys, values, address(_resolver));
    }

    function mintSLDToResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values,
        address resolver
    ) public onlyWhitelisted {
        _mintingController.mintSLDWithResolver(to, label, resolver);
        preconfigureResolver(label, keys, values, resolver);
    }

    function safeMintSLDToDefaultResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values
    ) public onlyWhitelisted {
        safeMintSLDToResolver(to, label, keys, values, address(_resolver));
    }

    function safeMintSLDToResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values,
        address resolver
    ) public onlyWhitelisted {
        _mintingController.safeMintSLDWithResolver(to, label, resolver);
        preconfigureResolver(label, keys, values, resolver);
    }

    function safeMintSLDToDefaultResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values,
        bytes memory _data
    ) public onlyWhitelisted {
        safeMintSLDToResolver(to, label, keys, values, _data, address(_resolver));
    }

    function safeMintSLDToResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values,
        bytes memory _data,
        address resolver
    ) public onlyWhitelisted {
        _mintingController.safeMintSLDWithResolver(to, label, resolver, _data);
        preconfigureResolver(label, keys, values, resolver);
    }

    function setDefaultResolver(address resolver) external onlyWhitelistAdmin {
        _resolver = Resolver(resolver);
    }

    function preconfigureResolver(
        string memory label,
        string[] memory keys,
        string[] memory values,
        address resolver
    ) private {
        if(keys.length == 0) {
            return;
        }

        Resolver(resolver).preconfigure(keys, values, _registry.childIdOf(_registry.root(), label));
    }

    function verifySigner(bytes32 data, bytes memory signature) private view {
        address signer = keccak256(abi.encodePacked(data, address(this)))
            .toEthSignedMessageHash()
            .recover(signature);
        require(signer != address(0), 'WhitelistedMinter: SIGNATURE_IS_INVALID');
        require(isWhitelisted(signer), 'WhitelistedMinter: SIGNER_IS_NOT_WHITELISTED');
    }

    /**
     * Proxy is an alternative solution for meta-transactions
     * Disadvantages:
     *  - the function can proxy any call, even we don't need to do this for some functions
     *  - in order to execute the logic the contract should be whitelisted by its own. lol
     * Advantages:
     *  - minimizing amount of code
     *  - no needs to sign one function signature, but execute another function (very confusing)
     */
    function proxy(bytes calldata data, bytes calldata signature) external returns(bytes memory) {
        // TODO: signature validation based on data + address(this)
        // TODO: rights validation

        (bool success, bytes memory result) = address(this).call(data);
        if (success == false) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }

        // Disadvantages of the implementation:
        // - low-level function 'call'
        // - inline assembly
        // - unclear how to return complex result from 'call'
        return result;
    }
}
