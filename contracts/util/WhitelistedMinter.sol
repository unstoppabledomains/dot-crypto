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

    MintingController internal _mintingController;
    Resolver internal _resolver;
    Registry internal _registry;

    constructor (Registry registry, MintingController mintingController) public {
        _mintingController = mintingController;
        _registry = registry;
    }

    function renounceMinter() external {
        _mintingController.renounceMinter();
    }

    function mintSLD(address to, string calldata label) external onlyWhitelisted {
        _mintingController.mintSLD(to, label);
    }

    function safeMintSLD(address to, string calldata label) external onlyWhitelisted {
        _mintingController.safeMintSLD(to, label);
    }

    function safeMintSLD(address to, string calldata label, bytes calldata _data) external onlyWhitelisted {
        _mintingController.safeMintSLD(to, label, _data);
    }

    function mintSLDToDefaultResolver(address to, string memory label, string[] memory keys, string[] memory values) public onlyWhitelisted {
        _mintingController.mintSLDWithResolver(to, label, address(_resolver));
        _resolver.preconfigure(keys, values, _registry.childIdOf(_registry.root(), label));
    }

    function setDefaultResolver(address resolver) external onlyWhitelistAdmin {
        _resolver = Resolver(resolver);
    }

}
