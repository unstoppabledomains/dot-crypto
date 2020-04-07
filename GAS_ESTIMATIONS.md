## Ganache
### Contract: Resolver
```
      ⓘ Resolver.resolveTo: 48485 gas (~$0.0136, 140 USD/ETH)
      ⓘ Resolver.set: 86942 gas (~$0.0243, 140 USD/ETH)
      ⓘ Resolver.setMany - one value: 89194 gas (~$0.025, 140 USD/ETH)
      ⓘ Resolver.setMany - two values: 148685 gas (~$0.0416, 140 USD/ETH)
      ⓘ Resolver.setMany - three values: 208112 gas (~$0.0583, 140 USD/ETH)
      ⓘ Resolver.reset: 53766 gas (~$0.0151, 140 USD/ETH)
    ✓ should resolve tokens (1011ms)
    ✓ should get key by hash (319ms)
    ✓ should get many keys by hashes (308ms)
      ⓘ Resolver.set - add new key hash: 87454 gas (~$0.0245, 140 USD/ETH)
      ⓘ Resolver.set - key hash already exists: 53596 gas (~$0.015, 140 USD/ETH)
      ⓘ Resolver.setMany - two values. Add new key hash: 149965 gas (~$0.042, 140 USD/ETH)
      ⓘ Resolver.setMany - two values. Key hashes already exists: 82249 gas (~$0.023, 140 USD/ETH)
      ⓘ Resolver.setMany - three values. Add new key hash: 210032 gas (~$0.0588, 140 USD/ETH)
      ⓘ Resolver.setMany - three values. Key hashes already exists: 108458 gas (~$0.0304, 140 USD/ETH)
    ✓ should not consume additional gas if key hash was set before (904ms)
    ✓ should get value by key hash (307ms)
    ✓ should get multiple values by hashes (415ms)
    ✓ should emit NewKey event new keys added (281ms)
    ✓ should emit correct Set event (206ms)
      ⓘ Resolver.reconfigure: 95013 gas (~$0.0266, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (443ms)
```

## Geth
### Contract: Resolver
```
      ⓘ Resolver.reconfigureFor: 151581 gas (~$0.0424, 140 USD/ETH)
    ✓ should reconfigure resolver with new values (1064ms)
      ⓘ Resolver.setManyFor - two values: 188133 gas (~$0.0527, 140 USD/ETH)
    ✓ should setManyFor (59ms)
```