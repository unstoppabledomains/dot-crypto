pragma solidity 0.5.11;

import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";
import "../controllers/IMintingController.sol";
import "../Registry.sol";

/**
 * @title WhitelistedMinter
 * @dev Defines the functions for distribution of Second Level Domains (SLD)s.
 */
contract WhitelistedMinter is IMintingController, WhitelistedRole {

    IMintingController internal _mintingController;

    constructor (IMintingController mintingController) public {
        _mintingController = mintingController;
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
