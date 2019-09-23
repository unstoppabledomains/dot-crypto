pragma solidity ^0.5.0;

import "./RepresentitiveRegistry.sol";
import "./SunriseRegistry.sol";
import "./PauseableRegistry.sol";

contract DotCrypto is Registry, PauseableRegistry, RepresentitiveRegistry, SunriseRegistry {

    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO = 0x095ea7b3;

    // TODO: real hash
    uint256 private constant _CRYPTO_HASH = 0x0;

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
    function assignSLD(address to, string calldata label) external onlyOwner {
        require(
            !_exists(uint256(keccak256(abi.encodePacked(uint256(_CRYPTO_HASH), keccak256(abi.encodePacked(label)))))),
            "DotCrypto: assigning sld token that already exists"
        );
        _assign(to, _CRYPTO_HASH, label);
    }
}
