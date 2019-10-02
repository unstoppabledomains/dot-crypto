pragma solidity ^0.5.0;

import './Registry.sol';
import '@openzeppelin/contracts/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/ownership/Ownable.sol';
import "@openzeppelin/contracts/access/roles/MinterRole.sol";

// TODO: use SafeMath

contract SunriseRegistry is Registry, MinterRole {

    event NewSunrise(uint256 sunrise);
    event SunriseMinted(uint256 indexed tokenId);
    event SunriseRenounced(uint256 indexed tokenId);

    // Optional mapping for sunrise times
    mapping(uint256 => bool) private _tokenSunrises;

    // Sunrise end
    uint256 private _sunrise;

    // TODO: figure out real interface
    bytes4 private constant _INTERFACE_ID_DOTCRYPTO_SUNRISE_REGISTRY =
        0x095ea7b3;

    constructor (/* uint256 sunrise */) public {
        _sunrise = 365 days /* sunrise */ + now;
        // register the supported interfaces to conform to Registry via ERC165
        _registerInterface(_INTERFACE_ID_DOTCRYPTO_SUNRISE_REGISTRY);
    }

    modifier whenSunrise() {
        require(!isSunriseOver(), "SunriseRegistry: sunrise is over");
        _;
    }

    function sunrise() external view returns (uint256) {
        require(_sunrise > now, "SunriseRegistry: sunrise is over");
        return _sunrise - now;
    }

    function isSunrise(uint256 tokenId) external view returns (bool) {
        if (isSunriseOver()) {
            return false;
        } else {
            return _tokenSunrises[tokenId];
        }
    }

    function isSunriseOver() public view returns (bool) {
        return _sunrise <= now;
    }

    function setSunrise(uint256 length) external onlyMinter whenSunrise {
        _sunrise = length + now;
        emit NewSunrise(_sunrise);
    }

    function mintSunriseSLD(
        address to,
        uint256 tokenId,
        string calldata label
    ) external onlyMinter whenSunrise {
        _tokenSunrises[tokenId] = true;
        _safeMintChild(to, tokenId, label, "");
        emit SunriseMinted(tokenId);
    }

    function burnSunriseSLD(
        uint256 tokenId
    ) external onlyMinter whenSunrise {
        if (_tokenSunrises[tokenId]) {
            _burn(tokenId);
        }
    }

    function renounceSunriseSLD(
        uint256 tokenId
    ) external onlyMinter whenSunrise {
         if (_tokenSunrises[tokenId]) {
            delete _tokenSunrises[tokenId];
            emit SunriseRenounced(tokenId);
        }
    }

    function _burn(uint256 tokenId) internal {
        super._burn(tokenId);
        if (_tokenSunrises[tokenId]) {
            delete _tokenSunrises[tokenId];
        }
    }
}
