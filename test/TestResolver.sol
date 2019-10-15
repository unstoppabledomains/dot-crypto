pragma solidity 0.5.11;

import "truffle/Assert.sol";
import "../contracts/registry/Registry.sol";
import "../contracts/controllers/MintingController.sol";
import "../contracts/resolver/SignatureResolver.sol";
import "./RegistryTestBase.sol";

contract TestResolver is RegistryTestBase {

  Registry registry;
  MintingController minting;
  Resolver resolver;

  function beforeEach() external {
    registry = new Registry();
    minting = new MintingController(registry);
    registry.addController(address(minting));
    registry.renounceController();
    resolver = new SignatureResolver(registry);
  }

  function test() external {
    (bool success, ) = address(resolver).call(abi.encodeWithSelector(resolver.set.selector, "key", "value", tok));
    Assert.isFalse(success, "should fail to set name if not owner");

    minting.mintSLD(address(this), "label");

    (success, ) = address(resolver).call(abi.encodeWithSelector(resolver.set.selector, "key", "value", tok));
    Assert.isFalse(success, "should fail to get name if not resolving to name");

    registry.resolveTo(address(resolver), tok);

    Assert.equal(registry.resolverOf(tok), address(resolver), "should resolve to resolver");

    resolver.set("key", "value", tok);

    Assert.equal(string(resolver.get("key", tok)), "value", "should get record properly");
  }
}
