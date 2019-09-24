pragma solidity ^0.5.0;

import "./RepresentativeRegistry.sol";
import "./SunriseRegistry.sol";
import "./PauseableRegistry.sol";

contract DotCrypto is Registry, Ownable /*, PauseableRegistry */ /*, RepresentativeRegistry */ /*, SunriseRegistry */ {

    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO = 0x095ea7b3;

    // TODO: real hash
    uint256 private constant _CRYPTO_HASH = 0x0f4a10a4f46c288cea365fcf45cccf0e9d901b945b9829ccdb54c10dc3cb7a6f;

    constructor () Metadata(".crypto", "UDC") public {
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO);
        _mint(address(0xdead), _CRYPTO_HASH);
        _setTokenURI(_CRYPTO_HASH, "crypto.");
    }

    /**
     * @dev Administrative function for assigning second level domains (SLDs).
     * @param to The address that will receive the sld.
     * @param label The new sld label
     */
    function mintSLD(address to, string calldata label) external onlyOwner {
        uint256 childId = _childId(_CRYPTO_HASH, label);
        require(!_exists(childId), "DotCrypto: sld token already exists");
        _mint(to, childId);
    }

    /**
     * @dev Administrative function for assigning second level domains (SLDs).
     * @param to The address that will receive the sld.
     * @param label The new sld label
     * @param _data bytes data to send along with a safe transfer check.
     */
    function safeMintSLD(address to, string memory label, bytes memory _data) public onlyOwner {
        uint256 childId = _childId(_CRYPTO_HASH, label);
        require(!_exists(childId), "DotCrypto: sld token already exists");
        _mint(to, childId);
        _checkOnERC721Received(address(0x0), to, childId, _data);
    }

    function safeMintSLD(address to, string calldata label) external onlyOwner {
        safeMintSLD(to, label, "");
    }
}
