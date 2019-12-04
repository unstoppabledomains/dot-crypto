#!/usr/bin/env bash

set -e
address='0x1a5363cA3ceeF73b1544732e3264F6D600cF678E'
label='brad'
token=$(dot-crypto call registry childIdOf $(dot-crypto call registry root) $label)

resolver='0x03d74EAac0D8E880337D6bA8e1ddf06058C4B9f8'

# dot-crypto call --gas-price 4 --sleep 15 registry burn $token

# exit

# dot-crypto call --gas-price 4 --sleep 15 whitelistedMinter mintSLD $address $label
# dot-crypto call registry ownerOf $token

# dot-crypto call --gas-price 10 whitelistedMinter addWhitelisted '0xa1DE9c9495D46dAc490517E3a99d38AfA4D01A62'

# exit

dot-crypto call --gas-price 10 whitelistedMinter mintSLD $address $label
dot-crypto call --gas-price 10 registry resolveTo $resolver $token
dot-crypto call --gas-price 10 resolver set 'test' 'testvalue' $token
dot-crypto call --gas-price 10 resolver set 'ipfs.html' 'QmVaAtQbi3EtsfpKoLzALm6vXphdi2KjMgxEDKeGg6wHuK' $token
dot-crypto call --gas-price 10 resolver set 'ipfs.redirect_domain' 'www.unstoppabledomains.com' $token
dot-crypto call --gas-price 10 resolver set 'crypto.BCH.address' 'qrq4sk49ayvepqz7j7ep8x4km2qp8lauvcnzhveyu6' $token
dot-crypto call --gas-price 10 resolver set 'crypto.BTC.address' '1EVt92qQnaLDcmVFtHivRJaunG2mf2C3mB' $token
dot-crypto call --gas-price 10 resolver set 'crypto.DASH.address' 'XnixreEBqFuSLnDSLNbfqMH1GsZk7cgW4j' $token
dot-crypto call --gas-price 10 resolver set 'crypto.ETH.address' '0x45b31e01AA6f42F0549aD482BE81635ED3149abb' $token
dot-crypto call --gas-price 10 resolver set 'crypto.LTC.address' 'LetmswTW3b7dgJ46mXuiXMUY17XbK29UmL' $token
dot-crypto call --gas-price 10 resolver set 'crypto.XMR.address' '447d7TVFkoQ57k3jm3wGKoEAkfEym59mK96Xw5yWamDNFGaLKW5wL2qK5RMTDKGSvYfQYVN7dLSrLdkwtKH3hwbSCQCu26d' $token
dot-crypto call --gas-price 10 resolver set 'crypto.ZEC.address' 't1h7ttmQvWCSH1wfrcmvT4mZJfGw2DgCSqV' $token
dot-crypto call --gas-price 10 resolver set 'crypto.ZIL.address' 'zil1yu5u4hegy9v3xgluweg4en54zm8f8auwxu0xxj' $token

dot-crypto call resolver get 'test' $token
dot-crypto call resolver get 'ipfs.html' $token
dot-crypto call resolver get 'ipfs.redirect_domain' $token
dot-crypto call resolver get 'crypto.BCH.address' $token
dot-crypto call resolver get 'crypto.BTC.address' $token
dot-crypto call resolver get 'crypto.DASH.address' $token
dot-crypto call resolver get 'crypto.ETH.address' $token
dot-crypto call resolver get 'crypto.LTC.address' $token
dot-crypto call resolver get 'crypto.XMR.address' $token
dot-crypto call resolver get 'crypto.ZEC.address' $token
dot-crypto call resolver get 'crypto.ZIL.address' $token

# ipfs.html=QmVaAtQbi3EtsfpKoLzALm6vXphdi2KjMgxEDKeGg6wHuK
# ipfs.redirect_domain=www.unstoppabledomains.com
# crypto.BCH.address=qrq4sk49ayvepqz7j7ep8x4km2qp8lauvcnzhveyu6
# crypto.BTC.address=1EVt92qQnaLDcmVFtHivRJaunG2mf2C3mB
# crypto.DASH.address=XnixreEBqFuSLnDSLNbfqMH1GsZk7cgW4j
# crypto.ETH.address=0x45b31e01AA6f42F0549aD482BE81635ED3149abb
# crypto.LTC.address=LetmswTW3b7dgJ46mXuiXMUY17XbK29UmL
# crypto.XMR.address=447d7TVFkoQ57k3jm3wGKoEAkfEym59mK96Xw5yWamDNFGaLKW5wL2qK5RMTDKGSvYfQYVN7dLSrLdkwtKH3hwbSCQCu26d
# crypto.ZEC.address=t1h7ttmQvWCSH1wfrcmvT4mZJfGw2DgCSqV
# crypto.ZIL.address=zil1yu5u4hegy9v3xgluweg4en54zm8f8auwxu0xxj
