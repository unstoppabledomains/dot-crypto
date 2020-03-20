# .crypto Design Flaws



## Solvable only by redeploying the registry


### Shared resolver records are not reset on transfer

### Shared resolver records are not reset on resolver assignment


## Solvable without redeploying the registry


### Custom records can not be mirrored

When resolver notifies registry about record being set via Registry#sync, it encodes the key using one way encryption.

### Resolver setPreset is not synced with registry


Can be solved by enabling `Registry#sync` call with some special `key` name (e.g. `_`) identying that all of the resolver records were reset for the domain

### Resolver need reconfigure and reconfigureFor methods

This methods would combine calls to #reset+#setMany which should simplify some end user flows requiring 1 signature and 1 tx instead of 2.
