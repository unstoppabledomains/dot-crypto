pragma solidity 0.5.12;

import "./BulkWhitelistedRole.sol";
import "../controllers/IMintingController.sol";
import "../controllers/MintingController.sol";
import "../Registry.sol";

/**
 * @title WhitelistedMinter
 * @dev Defines the functions for distribution of Second Level Domains (SLD)s.
 */
contract WhitelistedMinter is IMintingController, BulkWhitelistedRole {

    MintingController internal _mintingController;

    constructor (MintingController mintingController) public {
        _mintingController = mintingController;
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

}
