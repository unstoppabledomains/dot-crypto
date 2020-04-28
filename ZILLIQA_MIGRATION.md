## Migrate .zil from Zilliqa to Ethereum

1. Prepare contracts:
    * Fix all issues from DESIGN_FLAWS.md
    * Add  `Registry.transferOwnershipFromZilliqa(tokenId, publicKey, signature)` 
    * Add `transferMultiOwnershipFromZilliqa(tokenIds[], publicKey, signature)`
    * Add `WhitelistedMinterController.migrateFromZilliqa(label, keys, values, zilAddress)`
    * Add storage for zilliqa domains ownership `mapping tokenId -> zilAddress`
    * Ensure domains in zilliqa-ownership state can not be bestowed or managed.
  
2. Prepare resolution libraries to use new .zil registry. 
    * JS
    * Java
    * iOS
    * Notify 3rd party libs maintainers if any
3. Prepare website with updated functionality
    * Migrate .zil domain ownership functionality
    * Remove zilliqa crypto wallet uploading feature 
    * make sure old domains are still listed under "My Domains"
    * Implement .zil blockchain mirror with the ability to mirror old zil address ownership
    * Disable transfer and manage functionality for domains without migrated ownership
    * Implement new transfer/manage functionality .zil domains with migrated ownership
4. Build new Registry with `WhitelistedMinterController.migrateFromZilliqa`
4. Release
    * Release resolution libraries 
    * Notify clients that library upgrade required.
    * Release website
    * Notify users about ownership migration required.
5. Deprecate zilliqa registry 
    * Monitor registry for changes and notify people doing them if posssible
