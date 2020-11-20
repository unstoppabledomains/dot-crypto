pragma solidity 0.5.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/roles/WhitelistedRole.sol";
import "../IResolver.sol";
import "../IRegistryReader.sol";
import "../controllers/MintingController.sol";

contract FreeDomainsMinter is WhitelistedRole {
    string public constant NAME = 'Unstoppable Free Domains Minter';
    string public constant VERSION = '0.1.0';
    string private constant DOMAIN_NAME_PREFIX = 'unstoppable-development-';

    MintingController private mintingController;
    IResolver private resolver;
    IRegistryReader private registry;

    constructor(MintingController _mintingController, IResolver _resolver, IRegistryReader _registry) public {
        mintingController = _mintingController;
        resolver = _resolver;
        registry = _registry;
    }

    function claimDomain(string calldata _label) external {
        mintSLD(_label, msg.sender);
    }

    function claimDomain(string calldata _label, address _receiver) external {
        mintSLD(_label, _receiver);
    }

    function claimDomain(string calldata _label, address _receiver, string[] calldata _keys, string[] calldata _values) external {
        string memory labelWithPrefix = mintSLD(_label, _receiver);
        if (_keys.length == 0) {
            return;
        }
        resolver.preconfigure(_keys, _values, registry.childIdOf(registry.root(), labelWithPrefix));
    }

    function setDefaultResolver(address _resolver) external onlyWhitelistAdmin {
        resolver = IResolver(_resolver);
    }

    function getDefaultResolver() external view returns (address) {
        return address(resolver);
    }

    function mintSLD(string memory _label, address _receiver) private returns (string memory) {
        string memory labelWithPrefix = string(abi.encodePacked(DOMAIN_NAME_PREFIX, _label));
        mintingController.mintSLDWithResolver(_receiver, labelWithPrefix, address(resolver));

        return labelWithPrefix;
    }
}