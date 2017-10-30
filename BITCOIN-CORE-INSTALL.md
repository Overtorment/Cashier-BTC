Bitcoin Core quick install guide
================================

Install and run:

```bash
wget https://bitcoin.org/bin/bitcoin-core-0.15.0.1/bitcoin-0.15.0.1-x86_64-linux-gnu.tar.gz
tar -xvf  bitcoin-0.15.0.1-x86_64-linux-gnu.tar.gz 
cd bitcoin-0.15.0/
./bin/bitcoind -port=8444 -rpcport=8442 -datadir=/root/bitcoin-0.15.0/datadir  -rpcuser=user  -rpcpassword=pass -rpcbind=0.0.0.0  -rpcallowip=44.33.22.11
# dont forget to put your own allow ip, username, pass, datadir
```

Wait till it syncs (might take a while).

Run 

```bash
./bin/bitcoin-cli -rpcclienttimeout=30  -rpcport=8442  -rpcuser=user -rpcpassword=pass     getblockchaininfo
```

to check it. If it hangs - blockchain is busy syncing, check out `debug.log` in datadir for details.