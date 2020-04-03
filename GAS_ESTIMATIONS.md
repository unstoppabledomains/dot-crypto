## Ganache
### Contract: Resolver
```
      ⓘ Resolver.resolveTo: 48485 gas (~$0.0136, 140 USD/ETH)
      ⓘ Resolver.set: 83130 gas (~$0.0233, 140 USD/ETH)
      ⓘ Resolver.setMany - one value: 85382 gas (~$0.0239, 140 USD/ETH)
      ⓘ Resolver.setMany - two values: 141072 gas (~$0.0395, 140 USD/ETH)
      ⓘ Resolver.setMany - three values: 196699 gas (~$0.0551, 140 USD/ETH)
      ⓘ Resolver.reset: 53766 gas (~$0.0151, 140 USD/ETH)
    ✓ should resolve tokens (945ms)
    ✓ should get key by hash (228ms)
    ✓ should get many keys by hashes (269ms)
      ⓘ Resolver.set - add new key hash: 83642 gas (~$0.0234, 140 USD/ETH)
      ⓘ Resolver.set - key hash already exists: 51068 gas (~$0.0143, 140 USD/ETH)
      ⓘ Resolver.setMany - two values. Add new key hash: 142352 gas (~$0.0399, 140 USD/ETH)
      ⓘ Resolver.setMany - two values. Key hashes already exists: 77204 gas (~$0.0216, 140 USD/ETH)
      ⓘ Resolver.setMany - three values. Add new key hash: 198619 gas (~$0.0556, 140 USD/ETH)
      ⓘ Resolver.setMany - three values. Key hashes already exists: 100897 gas (~$0.0283, 140 USD/ETH)
    ✓ should not consume additional gas if key hash was set before (821ms)
    ✓ should get value by key hash (248ms)
    ✓ should get multiple values by hashes (348ms)
    ✓ should emit NewKey event new keys added (258ms)
    ✓ should emit correct Set event (195ms)
      ⓘ Resolver.reconfigure: 91201 gas (~$0.0255, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (423ms)
```

## Geth
### Contract: Resolver
```
      ⓘ Resolver.reconfigureFor: 147752 gas (~$0.0414, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (1057ms)
      ⓘ Resolver.setManyFor - two values: 180504 gas (~$0.0505, 140 USD/ETH)
    ✓ should setManyFor (1047ms)
```