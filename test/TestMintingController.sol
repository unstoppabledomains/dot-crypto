pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "../contracts/registry/Registry.sol";
import "../contracts/controllers/MintingController.sol";
import "./RegistryTestBase.sol";

// solium-disable security/no-low-level-calls

contract TestMintingController is RegistryTestBase {

  Registry registry;
  MintingController minting;

  function beforeEach() external {
    registry = new Registry();
    minting = new MintingController(registry);
    registry.addController(address(minting));
    registry.renounceController();
  }

  function test_mintSLD() external {
    minting.mintSLD(address(this), "label");

    Assert.equal(registry.ownerOf(tok), address(this), "minted SLD to address(this)");
    (bool success, ) = address(minting).call(abi.encodeWithSelector(minting.mintSLD.selector, address(this), tok));
    Assert.isFalse(success, "should fail mint owned SLD");

    registry.burn(tok);
    minting.mintSLD(address(this), "label");

    Assert.equal(registry.ownerOf(tok), address(this), "minted burnt SLD to address(this)");
  }

  function test_metadata() external {
    string memory rootURI = registry.tokenURI(root);
    Assert.equal(rootURI, "urn:udc:crypto", "DotCrypto root tokenURI is ok");

    (bool success, ) = address(registry).call(abi.encodeWithSelector(registry.tokenURI.selector, uint256(0x1)));
    Assert.isFalse(success, "should fail to get non existent tokenURI");

    minting.mintSLD(address(this), "label");

    string memory tokURI = registry.tokenURI(tok);
    Assert.equal(tokURI, "urn:udc:label.crypto", "DotCrypto tok tokenURI is ok");

    registry.burn(tok);

    (success, ) = address(registry).call(abi.encodeWithSelector(registry.tokenURI.selector, uint256(tok)));
    Assert.isFalse(success, "should fail to get non existent tokenURI");
  }

}
