pragma solidity 0.5.11;

import "truffle/Assert.sol";
import "../contracts/registry/Registry.sol";
import "../contracts/controllers/SunriseController.sol";
import "./RegistryTestBase.sol";

// solium-disable security/no-low-level-calls

contract TestSunriseController is RegistryTestBase {

  Registry registry;
  SunriseController sunrise;

  function beforeEach() external {
    registry = new Registry();
    sunrise = new SunriseController(registry, 365 days);
    registry.addController(address(sunrise));
    registry.renounceController();
  }

  function test_constructionAndSunriseLength() external {
    Assert.isFalse(sunrise.isSunriseOver(), "should be in sunrise period");
    Assert.equal(sunrise.sunrise(), 365 days, "should be in sunrise period");
    (bool success, ) = address(sunrise).call(abi.encodeWithSelector(sunrise.isSunrise.selector, tok));
    Assert.isFalse(success, "should not get sunrise for non existent token");

    sunrise.setSunrise(2);

    Assert.isFalse(sunrise.isSunriseOver(), "should be in sunrise period");
    Assert.equal(sunrise.sunrise(), 2, "should be in sunrise period");

    sunrise.setSunrise(0);

    Assert.isTrue(sunrise.isSunriseOver(), "should be in sunrise period");
    (success, ) = address(sunrise).call(abi.encodeWithSelector(sunrise.sunrise.selector));
    Assert.isFalse(success, "should not get sunrise once over");
    (success, ) = address(sunrise).call(abi.encodeWithSelector(sunrise.mintSunriseSLD.selector, address(this), "dummy"));
    Assert.isFalse(success, "should fail to mint sunrise domains after sunrise over");
    (success, ) = address(sunrise).call(abi.encodeWithSelector(sunrise.resolveSunriseSLD.selector, tok, true));
    Assert.isFalse(success, "should fail to renounce sunrise domains after sunrise over");
  }

  // function test_sunrise() external {
  //   sunrise.mintSLD(address(this), "label");

  //   Assert.equal(registry.ownerOf(tok), address(this), "should mint token to address(this)");
  //   Assert.isFalse(sunrise.isSunrise(tok), "should get sunrise status for regular token");

  //   registry.burn(tok);
  //   (bool success, ) = address(registry).call(abi.encodeWithSelector(registry.ownerOf.selector, tok));
  //   Assert.isFalse(success, "should burn token");

  //   sunrise.mintSunriseSLD(address(this), "label");

  //   Assert.equal(registry.ownerOf(tok), address(this), "should mint token to address(this)");
  //   Assert.isTrue(sunrise.isSunrise(tok), "should get sunrise for sunrise token");

  //   sunrise.resolveSunriseSLD(tok, false);

  //   (success, ) = address(sunrise).call(abi.encodeWithSelector(sunrise.isSunrise.selector, tok));
  //   Assert.isFalse(success, "should burn token sunrise");

  //   sunrise.mintSLD(address(this), "label");

  //   Assert.isFalse(sunrise.isSunrise(tok), "should not have leftover token sunrise after burning");

  //   registry.burn(tok);
  //   sunrise.mintSunriseSLD(address(this), "label");
  //   registry.burn(tok);

  //   (success, ) = address(sunrise).call(abi.encodeWithSelector(sunrise.isSunrise.selector, tok));
  //   Assert.isFalse(success, "should burn token sunrise using normal burn method");

  //   sunrise.mintSunriseSLD(address(this), "label");
  //   sunrise.resolveSunriseSLD(tok, true);

  //   Assert.equal(registry.ownerOf(tok), address(this), "should keep token at address(this) when renouncing");
  //   Assert.isFalse(sunrise.isSunrise(tok), "should burn token sunrise");
  // }

}
