pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "../contracts/registry/Registry.sol";
import "../contracts/controllers/ChildrenController.sol";
import "../contracts/controllers/MintingController.sol";
import "./RegistryTestBase.sol";

// solium-disable security/no-low-level-calls,max-len

contract TestChildrenController is RegistryTestBase {

  Registry registry;
  ChildrenController children;
  MintingController minting;

  function beforeEach() external {
    registry = new Registry();
    children = new ChildrenController(registry);
    minting = new MintingController(registry);
    registry.addController(address(children));
    registry.addController(address(minting));
    registry.renounceController();
  }

  function test_mintChild() external {
    minting.mintSLD(address(this), "label");
    children.mintChild(address(this), tok, "3ld");

    Assert.equal(registry.ownerOf(namehash(tok, "3ld")), address(this), "minted 3ld to address(this)");

    children.mintChild(address(this), namehash(tok, "3ld"), "4ld");

    Assert.equal(registry.ownerOf(namehash(namehash(tok, "3ld"), "4ld")), address(this), "minted 4ld to address(this)");

    registry.burn(namehash(namehash(tok, "3ld"), "4ld"));
    children.mintChild(address(this), namehash(tok, "3ld"), "4ld");

    Assert.equal(registry.ownerOf(namehash(namehash(tok, "3ld"), "4ld")), address(this), "minted 4ld to address(this)");
  }

  function test_transferFromChild() external {
    minting.mintSLD(address(this), "label");
    children.mintChild(address(this), tok, "3ld");
    children.safeTransferFromChild(address(this), address(1), tok, "3ld");

    Assert.equal(registry.ownerOf(namehash(tok, "3ld")), address(1), "transfered 3ld to address(1)");

    children.safeTransferFromChild(address(1), address(this), tok, "3ld");

    Assert.equal(registry.ownerOf(namehash(tok, "3ld")), address(this), "transfered 3ld to address(1)");

    registry.safeTransferFrom(address(this), address(1), tok);

    (bool success, ) = address(children).call(abi.encodeWithSelector(children.transferFromChild.selector, address(this), address(1), tok, "3ld"));
    Assert.isFalse(success, "should fail to transfer non owned token");
  }

  function test_burnChild() external {
    (bool success, ) = address(children).call(abi.encodeWithSelector(children.burnChild.selector, tok, "3ld"));
    Assert.isFalse(success, "should not burn non existent token");

    minting.mintSLD(address(this), "label");
    children.mintChild(address(this), tok, "3ld");
    children.burnChild(tok, "3ld");

    (success, ) = address(registry).call(abi.encodeWithSelector(registry.ownerOf.selector, namehash(tok, "3ld")));
    Assert.isFalse(success, "should not get owner for non existent token");
  }

}
