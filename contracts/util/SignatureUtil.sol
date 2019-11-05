pragma solidity 0.5.11;

import '../Registry.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';

// solium-disable error-reason

contract SignatureUtil {
    using ECDSA for bytes32;

    // Mapping from owner to a nonce
    mapping (address => uint256) internal _nonces;

    Registry internal _registry;

    // Mapping from owner to token ID to key to value
    mapping (address => mapping (uint256 => mapping (bytes => bytes))) internal _records;

    constructor(Registry registry) public {
        _registry = registry;
    }

    /**
     * @dev Gets the nonce of the specified address.
     * @param addr address to query nonce for
     * @return nonce of the given address
     */
    function nonceOf(address addr) external view returns (uint256) {
        return _nonces[addr];
    }

    function _validate(bytes32 hash, uint256 tokenId, bytes memory signature) internal {
        address owner = _registry.ownerOf(tokenId);
        uint256 nonce = _nonces[owner];

        require(
            _registry.isApprovedOrOwner(
                keccak256(abi.encodePacked(hash, address(_registry), nonce)).toEthSignedMessageHash().recover(signature),
                tokenId
            )
        );

        _nonces[owner] += 1;
    }

}
