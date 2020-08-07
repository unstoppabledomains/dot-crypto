# Browser Resolution How-to

This document describe a recommended way to resolve blockchain domain within a classical HTTP Web Browser or a Dapp Browser.
The document assumes that one having a basic understanding of how domain records are retrieved in general. See [Domain Resolution](./ARCHITECTURE.md#domain-resolution)

## End user features

### HTTP Website Browsing

1. Given a blockchain domain name configured to have a DNS record attached.
2. User enters a crypto domain within an address bar of a browser.
3. A browser resolves a domain and gets specified DNS records.
4. A browser requests and displays the content using DNS protocol and HTTP protocol.

### Distributed Website Browsing

1. Given a blockchain domain name configured to have a distributed network content hash (like IPFS)
2. User enters a crypto domain within an address bar of a browser.
3. A browser resolves a domain and gets the content hash of a domain
4. A browser retrieves a content by the hash using a related protocol and displays the content in browser

### Domain Level Redirect

1. Given a blockchain domain name configured to have a redirect url and IPFS hash
2. Given a browser that doesn't support IPFS protocol
3. User enters a crypto domain within an address bar of a browser.
4. A browser resolves a domain to the given records
5. A browser redirects user to the redirect URL because IPFS protocol is not supported

### Resolution Configuration

1. Given a user that want to change its ETH provider service.
2. User goes to browser settings crypto domains section.
3. User changes ethereum node URL from default to any other.
4. User changes Registry Address for each support crypto registry.
5. User changes network for ethereum node.
6. If network is not specified explicitly, it can be retrieved from the ethereum node URL.
7. If Registry Address is not specified, it can use a default for specified network.

## Content Display Protocol

In addition to base browser content display protocol like `http`, `https` or `ftp`. Blockchain domains can also be configured
for distributed content protocol like `ipfs`. It is strongly recommended for a browser to support the following distributed protocols:

* [IPFS](https://en.wikipedia.org/wiki/InterPlanetary_File_System) defining `ipfs://` protocol
* [BZZ](https://swarm-guide.readthedocs.io/en/stable/architecture.html#the-bzz-protocol) defining `bzz://` protocol

A browser may support any of traditional or distributed protocols that would still make crypto domains websites displayable.

## Records related to browser resolution

All records related to browser resolution are stored within these namespaces:

* `dns.*` - for traditional DNS records
* `dweb.*` - for distributed content records
* `browser.*` - hint records to help browser determine a preferred content display method

For a detailed records reference see [Records Reference](./RECORDS_REFERENCE.md).

If you are looking for a way to get records associated to a domain,
see [Domain Resolution](./ARCHITECTURE.md#domain-resolution).

## Browser Resolution Algorithm

This section explains how different records configuration of a domain should be interpreted by the browser.

A browser can select a protocol it has a support for.
If a domain is configured for multiple protocols, it should prioritize a protocol based on `browser.preferred_protocol` record that can be set to one of the following HTML transfer protocols:

* Traditional
  * http
  * https
  * ftp
* Distributed
  * bzz
  * ipfs

Browsers supporting distributed content protocol should always prioritize distributed content to be displayed for domains that do not have `browser.preferred_protocol` record set to traditional protocol. 
A domain can have a single content hash for each distributed protocol stored in `dweb.<protocol>.hash`. Ex: `dweb.bzz.hash` for Swarm's `bzz` protocol. See [Dweb Records](./ARCHITECTURE.md#dweb-records) for more information.

If none of `dweb` hash records is set, a browser should fall back to DNS resolution that is set within `dns.*` namespace.
See [DNS Records](./ARCHITECTURE.md#dns-records) for more information

Generally browsers automatically add `http://` prefix for any domain in the address bar if the protocol is not specified explicitly by the user. In case of blockchain domain names inside a browser that suppose to support many protocols, it is preferred to determine a protocol only after a domain being resolved based on specified records for a domain.


<div id="legacy-records"></div>

### Legacy Records Support

Most .crypto domains as of Q3 2020 are configured using legacy record names for IPFS hash and redirect domain:

1. `ipfs.html.value` deprecated in favor of `dweb.ipfs.hash`
2. `ipfs.redirect_domain` deprecated in favor of `browser.redirect_url`

A browser is strongly recommended to support those records as a fallback when corresponding replacement records are not set.
