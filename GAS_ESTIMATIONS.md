## Ganache
### Contract: Resolver
```
      ⓘ Resolver.resolveTo: 48485 gas (~$0.0136, 140 USD/ETH)
      ⓘ Resolver.set: 82714 gas (~$0.0232, 140 USD/ETH)
      ⓘ Resolver.setMany - one value: 84944 gas (~$0.0238, 140 USD/ETH)
      ⓘ Resolver.setMany - two values: 140185 gas (~$0.0393, 140 USD/ETH)
      ⓘ Resolver.setMany - three values: 195362 gas (~$0.0547, 140 USD/ETH)
      ⓘ Resolver.setPreset: 54532 gas (~$0.0153, 140 USD/ETH)
      ⓘ Resolver.reset: 39144 gas (~$0.011, 140 USD/ETH)
    ✓ should resolve tokens (1052ms)
    ✓ should get key by hash (220ms)
    ✓ should get many keys by hashes (279ms)
      ⓘ Resolver.set - add new key hash: 83226 gas (~$0.0233, 140 USD/ETH)
      ⓘ Resolver.set - key hash already exists: 52658 gas (~$0.0147, 140 USD/ETH)
      ⓘ Resolver.setMany - two values. Add new key hash: 141465 gas (~$0.0396, 140 USD/ETH)
      ⓘ Resolver.setMany - two values. Key hashes already exists: 80329 gas (~$0.0225, 140 USD/ETH)
      ⓘ Resolver.setMany - three values. Add new key hash: 197282 gas (~$0.0552, 140 USD/ETH)
      ⓘ Resolver.setMany - three values. Key hashes already exists: 105578 gas (~$0.0296, 140 USD/ETH)
    ✓ should not consume additional gas if key hash was set before (797ms)
    ✓ should get value by key hash (242ms)
    ✓ should get multiple values by hashes (367ms)
    ✓ should set isNewKey = true for new keys isNewKey = false for already added keys (271ms)
    ✓ should product correct Set event (194ms)
      ⓘ Resolver.reconfigure: 91141 gas (~$0.0255, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (456ms)
```

## Geth
### Contract: Resolver
```
      ⓘ Resolver.reconfigureFor: 147711 gas (~$0.0414, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (47ms)
      ⓘ Resolver.setManyFor - two values: 179635 gas (~$0.0503, 140 USD/ETH)
    ✓ should setManyFor (1049ms)
```