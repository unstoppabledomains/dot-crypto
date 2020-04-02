## Ganache
### Contract: Resolver
```
      ⓘ Resolver.resolveTo: 48485 gas (~$0.0136, 140 USD/ETH)
      ⓘ Resolver.set: 82742 gas (~$0.0232, 140 USD/ETH)
      ⓘ Resolver.setMany - one value: 84972 gas (~$0.0238, 140 USD/ETH)
      ⓘ Resolver.setMany - two values: 140241 gas (~$0.0393, 140 USD/ETH)
      ⓘ Resolver.setMany - three values: 195446 gas (~$0.0547, 140 USD/ETH)
      ⓘ Resolver.setPreset: 54532 gas (~$0.0153, 140 USD/ETH)
      ⓘ Resolver.reset: 39144 gas (~$0.011, 140 USD/ETH)
    ✓ should resolve tokens (1079ms)
    ✓ should get key by hash (222ms)
    ✓ should get many keys by hashes (271ms)
      ⓘ Resolver.set - add new key hash: 83254 gas (~$0.0233, 140 USD/ETH)
      ⓘ Resolver.set - hey hash already exists: 52678 gas (~$0.0147, 140 USD/ETH)
    ✓ should not consume additional gas if key hash was set before (265ms)
    ✓ should get value by key hash (242ms)
    ✓ should get multiple values by hashes (284ms)
    ✓ should set isNewKey = true for new keys isNewKey = false for already added keys (263ms)
    ✓ should product correct Set event (196ms)
      ⓘ Resolver.reconfigure: 91169 gas (~$0.0255, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (453ms)
```

## Geth
### Contract: Resolver
```
      ⓘ Resolver.reconfigureFor: 147759 gas (~$0.0414, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (2071ms)
```