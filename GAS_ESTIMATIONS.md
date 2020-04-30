# Smart contracts gas usage estimations

## Ganache
### Contract: Resolver
```
      ⓘ Resolver.resolveTo: 48485 gas (~$0.2971, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.set: 86947 gas (~$0.5329, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.setMany - one value: 89199 gas (~$0.5467, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.setMany - two values: 148690 gas (~$0.9113, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.setMany - three values: 208117 gas (~$1.2755, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.reset: 53771 gas (~$0.3295, 211.33 USD/ETH, 29 Gas Price in Gwei)
    ✓ should resolve tokens (1011ms)
    ✓ should get key by hash (229ms)
    ✓ should get many keys by hashes (338ms)
      ⓘ Resolver.set - add new key hash: 87459 gas (~$0.536, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.set - key hash already exists: 53601 gas (~$0.3285, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.setMany - two values. Add new key hash: 149970 gas (~$0.9191, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.setMany - two values. Key hashes already exists: 82254 gas (~$0.5041, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.setMany - three values. Add new key hash: 210037 gas (~$1.2872, 211.33 USD/ETH, 29 Gas Price in Gwei)
      ⓘ Resolver.setMany - three values. Key hashes already exists: 108463 gas (~$0.6647, 211.33 USD/ETH, 29 Gas Price in Gwei)
    ✓ should not consume additional gas if key hash was set before (935ms)
    ✓ should get value by key hash (269ms)
    ✓ should get multiple values by hashes (368ms)
    ✓ should emit NewKey event new keys added (285ms)
    ✓ should emit correct Set event (215ms)
      ⓘ Resolver.reconfigure: 95018 gas (~$0.5823, 211.33 USD/ETH, 29 Gas Price in Gwei)
    ✓ should reconfigure resolver with new values (475ms)
```

### Contract: DomainZoneController
```
    ✓ should accept addreses on contract deploy (91ms)
    ✓ should deploy contract with empty addresses array (55ms)
    ✓ addresses added in constructor should be whitelisted (245ms)
    ✓ address should not be whitelisted if weren't added (114ms)
      ⓘ DomainZoneController.mintChild - no records: 192662 gas (~$1.0651, 212.62 USD/ETH, 26 Gas Price in Gwei)
    ✓ should mint new child (subdomain) from whitelisted address (299ms)
      ⓘ DomainZoneController.mintChild - three records: 536569 gas (~$2.9662, 212.62 USD/ETH, 26 Gas Price in Gwei)
    ✓ should mint new child (subdomain) with predefined resolver and domain records (561ms)
    ✓ should not allow mint subdomain from not whitelisted address (157ms)
    ✓ should transfer minted domain to owner (325ms)
    ✓ should not allow minting from not allowed second-level domains (59ms)
      ⓘ DomainZoneController.resolveTo: 51646 gas (~$0.2855, 212.62 USD/ETH, 26 Gas Price in Gwei)
    ✓ should resolve to new resolver (423ms)
    ✓ should not resolve to new resolver from not whitelisted address (244ms)
      ⓘ DomainZoneController.setMany - three records: 292554 gas (~$1.6173, 212.62 USD/ETH, 26 Gas Price in Gwei)
    ✓ should set records for domain (543ms)
    ✓ should not set records from not whitelisted address (303ms)
    ✓ should emit MintChild event (278ms)
```

## Geth
### Contract: Resolver
```
      ⓘ Resolver.reconfigureFor: 151581 gas (~$0.784, 213.72 USD/ETH, 24.2 Gas Price in Gwei)
    ✓ should reconfigure resolver with new values (65ms)
      ⓘ Resolver.setManyFor - two values: 188133 gas (~$0.973, 213.72 USD/ETH, 24.2 Gas Price in Gwei)
    ✓ should setManyFor (1059ms)
```