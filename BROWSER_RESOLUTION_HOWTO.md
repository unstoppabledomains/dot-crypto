# Browser Resolution How-to

This document describe a recommended way to resolve blockchain domain within a classical HTTP Web Browser or a Dapp Browser.

## End user features

### HTTP Website Browsing

1. Given a blockchain domain name configured to have a DNS record attached.
2. User enters a crypto domain within an address bar of a browser.
3. A browser resolves a domain and gets specified DNS records.
4. A browser requests and displays the content using DNS protocol.

### IPFS Website Browsing

1. Given a blockchain domain name configured to have IPFS hash attached
2. User enters a crypto domain within an address bar of a browser.
3. A browser resolves a domain and gets IPFS hash of a domain
4. A browser retrieves a content by IPFS hash using IPFS protocol

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
For More general information on how a crypto domain records can be retrieved
see [Domain Resolution](./ARCHITECTURE.md#domain-resolution).

A domain can be resolved to an IPFS hash or using a classical DNS resolution protocol.
A browser may support any of these methods or both of them.

Browsers supporting IPFS content display should always prioritize IPFS content to be displayed. 
IPFS resolution is set using 2 records: 

1. `ipfs.html.value` - an IPFS hash for the content to be displayed
2. `ipfs.redirect_domain.value`. - an URL where a user suppose to be redirected.

See [IPFS Records](./ARCHITECTURE.md#ipfs-records) for more information.

If first record isn't set or IPFS protocol is not supported, a browser should lookup a second record.

If none of IPFS records is set, a browser should fall back to DNS resolution. It is set within `dns.*` namespace.
See [DNS Records](./ARCHITECTURE.md#dns-records) for more information

Generally browsers automatically add `http://` prefix for any domain in the address bar if the protocol is not specified explicitly. In case of blockchain domain names inside a browser that suppose to support both content display methods, it is preferred to prefix a protocol only after a domain being resolved based on specified records for a domain.



