# Smart contracts gas usage estimations

## Timestamp
May 6, 2020, 10:17 UTC

## Ganache
### Contract: Resolver
```
      ⓘ Resolver.resolveTo: 48485 gas (~$0.1308, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.set: 86947 gas (~$0.2345, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.setMany - one value: 89199 gas (~$0.2405, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.setMany - two values: 148690 gas (~$0.401, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.setMany - three values: 208117 gas (~$0.5612, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.reset: 53771 gas (~$0.145, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should resolve tokens (1063ms)
    ✓ should get key by hash (250ms)
    ✓ should get many keys by hashes (307ms)
      ⓘ Resolver.set - add new key hash: 87459 gas (~$0.2359, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.set - key hash already exists: 53601 gas (~$0.1445, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.setMany - two values. Add new key hash: 149970 gas (~$0.4044, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.setMany - two values. Key hashes already exists: 82254 gas (~$0.2218, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.setMany - three values. Add new key hash: 210037 gas (~$0.5664, 207.44 USD/ETH, 13 Gas Price in Gwei)
      ⓘ Resolver.setMany - three values. Key hashes already exists: 108463 gas (~$0.2925, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should not consume additional gas if key hash was set before (949ms)
    ✓ should get value by key hash (253ms)
    ✓ should get multiple values by hashes (364ms)
    ✓ should emit NewKey event new keys added (280ms)
    ✓ should emit correct Set event (206ms)
      ⓘ Resolver.reconfigure: 95018 gas (~$0.2562, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should reconfigure resolver with new values (472ms)
```

### Contract: DomainZoneController
```
    ✓ should accept addreses on contract deploy (97ms)
    ✓ should deploy contract with empty addresses array (51ms)
    ✓ addresses added in constructor should be whitelisted (238ms)
    ✓ address should not be whitelisted if wasn't added (118ms)
      ⓘ DomainZoneController.mintChild - no records: 111933 gas (~$0.3019, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should mint new child (subdomain) from whitelisted address (248ms)
      ⓘ DomainZoneController.mintChild - three records: 538271 gas (~$1.4516, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should mint new child (subdomain) with predefined resolver and domain records (534ms)
    ✓ should not allow mint subdomain from not whitelisted address (148ms)
    ✓ should transfer minted domain to owner (231ms)
    ✓ should not allow minting from not allowed second-level domains (54ms)
      ⓘ DomainZoneController.resolveTo: 51646 gas (~$0.1393, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should resolve to new resolver (461ms)
    ✓ should not resolve to new resolver from not whitelisted address (245ms)
      ⓘ DomainZoneController.setMany - three records: 292554 gas (~$0.7889, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should set records for domain (542ms)
    ✓ should not set records from not whitelisted address (314ms)
    ✓ should emit MintChild event (218ms)
```

### Contract: TwitterValidationOperator
```
      ⓘ TwitterValidationOperator.setValidation - first validation, first domain: 226267 gas (~$0.0905, 200 USD/ETH, 2 Gas Price in Gwei)
      ⓘ TwitterValidationOperator.setValidation - second validation, first domain: 103158 gas (~$0.0413, 200 USD/ETH, 2 Gas Price in Gwei)
      ⓘ TwitterValidationOperator.setValidation - third validation, second domain: 130100 gas (~$0.052, 200 USD/ETH, 2 Gas Price in Gwei)
```

## Geth
### Contract: Resolver
```
      ⓘ Resolver.reconfigureFor: 151581 gas (~$0.4088, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should reconfigure resolver with new values (1075ms)
      ⓘ Resolver.setManyFor - two values: 188133 gas (~$0.5073, 207.44 USD/ETH, 13 Gas Price in Gwei)
    ✓ should setManyFor (53ms)
```