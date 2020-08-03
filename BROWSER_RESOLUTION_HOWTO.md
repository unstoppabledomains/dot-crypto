Questions:
How do DNS records for sub domains work if the parent domains show these records?

# Browser Resolution How-to

This document describe a recommended way to resolve blockchain domain within a classical HTTP Web Browser or a Dapp Browser.

## End user features

### HTTP Website Browsing

1. Given a blockchain domain name configured to have a DNS record attached.
2. User enters a crypto domain within an address bar of a browser.
3. A browser resolves a domain and gets specified DNS records.
4. A browser requests and displays the content using DNS protocol.

### Distributed Website Browsing

1. Given a blockchain domain name configured to have a distributed network content hash
2. User enters a crypto domain within an address bar of a browser.
3. A browser resolves a domain and gets eth content hash of the domain
4. A browser retrieves a content by the hash using a related protocol

### Resolution Configuration

1. Given a user that want to change its eth provider service.
2. User goes to browser settings crypto domains section.
3. User changes ethereum node URL from default to any other.
4. User changes Registry Address for each support crypto registry.
5. User changes network for ethereum node.
6. If network is not specified explicitly, it can be retrieved from the ethereum node URL.
7. If Registry Address is not specified, it can use a default for specified network.

## Browser Resolution Algorithm

Different crypto records configurations need to be interpreted differently by a browser.
This algorithm requires one to learn how to fetch domain records first.
See [Domain Resolution](./ARCHITECTURE.md#domain-resolution).

A domain can be resolved to a distributed file system hash or using a classical DNS resolution protocol.
A browser may support any of these methods or both of them.
Distributed file system protocol currently supported are:

* [IPFS]() defining `ipfs://` protocol
* [Swarm]() defining `bzz://` protocol

Browsers supporting distributed content protocol content display should always prioritize distributed content to be displayed. 
A ditributed content hash for a protocol is stored in a record `browser.dweb.<protocol>.hash`. Ex: `browser.dweb.bzz.hash` for Swarm.

A domain can have a single content hash for each protocol. A browser can select a protocol it has a support for.
If browser is supporting both protocols, it should prioritize a protocol based on `browser.preferred_protocol` record that can be set to one of the following HTML transfer protocols:

* http
* https
* bzz
* ipfs


If none of dweb hash records is set, a browser should fall back to DNS resolution. It is set within `dns.*` namespace.
See [DNS Records](./ARCHITECTURE.md#dns-records) for more information

Generally browsers automatically add `http://` prefix for any domain in the address bar if the protocol is not specified explicitly by the user. In case of blockchain domain names inside a browser that suppose to support both content display methods, it is preferred to determine a protocol only after a domain being resolved based on specified records for a domain.

For a detailed records reference see
See [IPFS Records](./RECORDS_REFERRENCE.md) for more information.

<div id="legacy-records"></div>

### Legacy Records Support

`ipfs.html.value`
`ipfs.redirect_domain`

TODO describe how to handle them
