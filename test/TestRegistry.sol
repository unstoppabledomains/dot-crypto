pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "./RegistryTestBase.sol";
import "../contracts/registry/Registry.sol";
import "../contracts/controllers/MintingController.sol";

contract TestRegistry is RegistryTestBase {

  Registry registry;
  MintingController minting;

  function beforeEach() external {
    registry = new Registry();
    minting = new MintingController(registry);
    registry.addController(address(minting));
    registry.renounceController();
  }

  function test_construction() external {
    Registry r = new Registry();

    r.addController(address(1));
    r.addController(address(2));
    r.renounceController();

    Assert.isTrue(r.isController(address(1)), "all controllers initialized correctly");
    Assert.isTrue(r.isController(address(2)), "all controllers initialized correctly");
    Assert.isFalse(r.isController(address(this)), "all controllers initialized correctly");
  }

  // function test_resolution() external {
  //   (bool success, ) = address(registry).call(abi.encodeWithSelector(registry.resolverOf.selector, tok));
  //   Assert.isFalse(success, "should fail to get non existent token");

  //   minting.mintSLD(address(this), "label");

  //   (success, ) = address(registry).call(abi.encodeWithSelector(registry.resolverOf.selector, tok));
  //   Assert.isFalse(success, "should fail to get non existent resolver");

  //   registry.resolveTo(address(0x1234), tok);

  //   address resolver = registry.resolverOf(tok);
  //   Assert.equal(resolver, address(0x1234), "should get resolver");

  //   registry.burn(tok);
  //   minting.mintSLD(address(0xdead), "label");

  //   (success, ) = address(registry).call(abi.encodeWithSelector(registry.resolveTo.selector, address(0x1234), tok));
  //   Assert.isFalse(success, "should fail to set resolve if not approved or owner");
  // }

}
