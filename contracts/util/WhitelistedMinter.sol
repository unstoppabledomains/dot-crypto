pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

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
    string public constant NAME = 'Unstoppable Whitelisted Minter';
    string public constant VERSION = '0.1.0';

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
        require(
            receiver != address(0x0),
            "WhitelistedMinter: receiver must be non-zero."
        );

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
        require(
            receiver != address(0x0),
            "WhitelistedMinter: receiver must be non-zero."
        );

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
        _mintingController.mintSLDWithResolver(to, label, address(_resolver));
        _resolver.preconfigure(
            keys,
            values,
            _registry.childIdOf(_registry.root(), label)
        );
    }

    function safeMintSLDToDefaultResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values
    ) public onlyWhitelisted {
        _mintingController.safeMintSLDWithResolver(
            to,
            label,
            address(_resolver)
        );
        _resolver.preconfigure(
            keys,
            values,
            _registry.childIdOf(_registry.root(), label)
        );
    }

    function safeMintSLDToDefaultResolver(
        address to,
        string memory label,
        string[] memory keys,
        string[] memory values,
        bytes memory _data
    ) public onlyWhitelisted {
        _mintingController.safeMintSLDWithResolver(
            to,
            label,
            address(_resolver),
            _data
        );
        _resolver.preconfigure(
            keys,
            values,
            _registry.childIdOf(_registry.root(), label)
        );
    }

    function setDefaultResolver(address resolver) external onlyWhitelistAdmin {
        _resolver = Resolver(resolver);
    }
}
