FROM ethereum/client-go:v1.9.12

ENV GETH_OPTIONS "-dev -dev.period 0 -rpc -rpcport 7545 --rpcaddr 0.0.0.0 --wsaddr 0.0.0.0  --miner.gastarget 0x2014103 -keystore geth -password ''" 

EXPOSE 7545

ENTRYPOINT "/usr/local/bin/geth" $GETH_OPTIONS