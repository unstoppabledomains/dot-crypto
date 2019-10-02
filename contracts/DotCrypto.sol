pragma solidity ^0.5.0;

import "./registry/RepresentativeRegistry.sol";
import "./registry/SunriseRegistry.sol";
import "@openzeppelin/contracts/access/roles/MinterRole.sol";

contract DotCrypto is
    Registry,
    MinterRole/* ,
    RepresentativeRegistry,
    SunriseRegistry */ {

    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO = 0x095ea7b3;

    // TODO: real hash
    uint256 private constant _CRYPTO_HASH =
        0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f;

    constructor () Metadata(".crypto", "UDC") /* SunriseRegistry(365 days) */ public {
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO);
        _mint(address(0xdead), _CRYPTO_HASH);
        _setTokenURI(_CRYPTO_HASH, "crypto.");
    }

    function root() external pure returns (uint256) {
        return _CRYPTO_HASH;
    }

    /**
     * @dev Administrative function for assigning second level domains (SLDs).
     * @param to The address that will receive the sld.
     * @param label The new sld label
     */
    function mintSLD(
        address to,
        string calldata label
    ) external onlyMinter {
        uint256 childId = _childId(_CRYPTO_HASH, label);
        _mint(to, childId);
        _setTokenURI(
            childId,
            string(abi.encodePacked(label, ".", _tokenURIs[_CRYPTO_HASH]))
        );
    }

    /**
     * @dev Administrative function for assigning second level domains (SLDs).
     * @param to The address that will receive the sld.
     * @param label The new sld label
     * @param _data bytes data to send along with a safe transfer check.
     */
    function safeMintSLD(
        address to,
        string memory label,
        bytes memory _data
    ) public onlyMinter {
        uint256 childId = _childId(_CRYPTO_HASH, label);
        _mint(to, childId);
        _setTokenURI(
            childId,
            string(abi.encodePacked(label, ".", _tokenURIs[_CRYPTO_HASH]))
        );
        _checkOnERC721Received(address(0x0), to, childId, _data);
    }

    function safeMintSLD(address to, string calldata label) external {
        safeMintSLD(to, label, "");
    }
}
