# Browser Resolution How-to

This document describe a recommended way to resolve blockchain domain within a classical HTTP Web Browser or a Dapp Browser.

## End user features

### Website Browsing

1. Given a blockchain domain name configured to have a DNS record attached.
2. User enters a crypto domain within an address bar of a browser.
3. A browser resolves a domain and gets specified DNS records.
4. A browser requests and displays the content using DNS protocol.

### Resolution Configuration

1. Given a user that want to change its eth provider service.
2. User goes to browser settings crypto domains section.
3. User changes ethereum node URL from default to any other.
4. User changes Registry Address for each support crypto registry.
5. User changes network for ethereum node.
6. If network is not specified explicitly, it can be retrieved from the ethereum node URL.


### Technical reference

1. [Domain Resolution](./ARCHITECTURE.md#domain-resolution) - general information on how any domain record can be retrieved.
2. [DNS Records](./ARCHITECTURE.md#dns) - information on how DNS records are stored within crypto registry.
