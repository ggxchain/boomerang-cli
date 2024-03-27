# boomerang-cli

## 1 install bitcoin UI and run wallet rpc serve

download from https://bitcoincore.org/bin/bitcoin-core-22.0/

macos run

```
/Applications/Bitcoin-Qt.app/Contents/MacOS/Bitcoin-Qt -regtest -server -rpcuser=rpcuser -rpcpassword=rpcpassword -rpcport=18332
```

linux run

```
bitcoin-qt  -regtest -server -rpcuser=rpcuser -rpcpassword=rpcpassword -rpcport=18332
```

tip: Macos need install bitcoin-cli from code

```
//install bitcoin v22.0 bitcoin-cli

git clone https://github.com/bitcoin/bitcoin.git
cd bitcoin
git checkout a0988140b7
./autogen.sh
./configure
make
sudo make install
```

tip: may need install autoconf automake

## 2 run test

yarn test

## 3 CreateBoomerang

### 3.1 build code

yarn install
yarn build

### 3.2 set bcli alias

alias bcli='bitcoin-cli -regtest -rpcuser=rpcuser -rpcpassword=rpcpassword -rpcport=18332'

tip: test key

```
Owner:      Key:                                                                Pubkey:
alice       2bd806c97f0e00af1a1fc3328fa763a9269723c8db8fac4f93af71db186d6e90    9997a497d964fc1a62885b05a51166a65a90df00492c8d7cf61d6accf54803be
ggx         81b637d8fcd2c6da6359e6963113a1170de795e4b725b84d1e0b4cfd9ec58ce9    4edfcf9dfe6c0b5c83d1ab3f78d1b39a46ebac6798e08e19761f5ed89ec83c10
intrnl      1229101a0fcf2104e8808dab35661134aa5903867d44deb73ce1c7e4eb925be8    f30544d6009c8d8d94f5d030b2e844b1a3ca036255161c479db1cca5b374dd1c
```

### 3.2 send btc to alice address mkESjLZW66TmHhiFX8MCaBjrhZ543PPh9a

```
bcli sendtoaddress mkESjLZW66TmHhiFX8MCaBjrhZ543PPh9a  1
```

output

```
57bcebcbfe16f449cd75fe53378161ed53c4a49f846390f4af3728f95716d0c5
```

### 3.4 get unspend utxo

```
bcli getrawtransaction  57bcebcbfe16f449cd75fe53378161ed53c4a49f846390f4af3728f95716d0c5 1
```

output

```
{
  "txid": "57bcebcbfe16f449cd75fe53378161ed53c4a49f846390f4af3728f95716d0c5",
  "hash": "57bcebcbfe16f449cd75fe53378161ed53c4a49f846390f4af3728f95716d0c5",
  "version": 2,
  "size": 225,
  "vsize": 225,
  "weight": 900,
  "locktime": 464,
  "vin": [
    {
      "txid": "0dfaa439955be096ffb082ab22211110cf9c162514b917bbca30a910dbcc7d74",
      "vout": 0,
      "scriptSig": {
        "asm": "3044022006100698356ac19055de26866a8a86157dc0f0512892bfca45a25b6e70a3217502206f9e917581afcaad2d2210ce47522c444ff1110669ba43d55df60a6e8fc8d5fe[ALL] 02030bb4c9910925b67079f9755fadbb8dbfb09adc0c16275ee258d28ed686ac9a",
        "hex": "473044022006100698356ac19055de26866a8a86157dc0f0512892bfca45a25b6e70a3217502206f9e917581afcaad2d2210ce47522c444ff1110669ba43d55df60a6e8fc8d5fe012102030bb4c9910925b67079f9755fadbb8dbfb09adc0c16275ee258d28ed686ac9a"
      },
      "sequence": 4294967293
    }
  ],
  "vout": [
    {
      "value": 1.00000000,
      "n": 0,
      "scriptPubKey": {
        "asm": "OP_DUP OP_HASH160 33b94b70bbd434f0ad01925669bedf3469832b58 OP_EQUALVERIFY OP_CHECKSIG",
        "desc": "addr(mkESjLZW66TmHhiFX8MCaBjrhZ543PPh9a)#sf4zxhpd",
        "hex": "76a91433b94b70bbd434f0ad01925669bedf3469832b5888ac",
        "address": "mkESjLZW66TmHhiFX8MCaBjrhZ543PPh9a",
        "type": "pubkeyhash"
      }
    },
    {
      "value": 11.49498728,
      "n": 1,
      "scriptPubKey": {
        "asm": "OP_DUP OP_HASH160 6a872a27dedf9ee72fed358f93f83b503286d3f3 OP_EQUALVERIFY OP_CHECKSIG",
        "desc": "addr(mqEDqo1LaaReobzLr1qf6DZ6DJycYzZ5o6)#hv0hhvyu",
        "hex": "76a9146a872a27dedf9ee72fed358f93f83b503286d3f388ac",
        "address": "mqEDqo1LaaReobzLr1qf6DZ6DJycYzZ5o6",
        "type": "pubkeyhash"
      }
    }
  ],
  "hex": "0200000001747dccdb10a930cabb17b91425169ccf10112122ab82b0ff96e05b9539a4fa0d000000006a473044022006100698356ac19055de26866a8a86157dc0f0512892bfca45a25b6e70a3217502206f9e917581afcaad2d2210ce47522c444ff1110669ba43d55df60a6e8fc8d5fe012102030bb4c9910925b67079f9755fadbb8dbfb09adc0c16275ee258d28ed686ac9afdffffff0200e1f505000000001976a91433b94b70bbd434f0ad01925669bedf3469832b5888ac68f58344000000001976a9146a872a27dedf9ee72fed358f93f83b503286d3f388acd0010000"
}
```

### 3.5 call createboomerang utxo

```
node ./dist/index.js -c 1 --amount  100000000 --utxo-txid=57bcebcbfe16f449cd75fe53378161ed53c4a49f846390f4af3728f95716d0c5 --utxo-index 0 --private-key 2bd806c97f0e00af1a1fc3328fa763a9269723c8db8fac4f93af71db186d6e90   --private-key-internal 1229101a0fcf2104e8808dab35661134aa5903867d44deb73ce1c7e4eb925be8  --lock-time 100
```

output

```
  ____                                                      ____ _ _
 | __ )  ___   ___  _ __ ___   ___ _ __ __ _ _ __   __ _   / ___| (_)
 |  _ \ / _ \ / _ \| '_ ` _ \ / _ \ '__/ _` | '_ \ / _` | | |   | | |
 | |_) | (_) | (_) | | | | | |  __/ | | (_| | | | | (_| | | |___| | |
 |____/ \___/ \___/|_| |_| |_|\___|_|  \__,_|_| |_|\__, |  \____|_|_|
                                                   |___/
### user address  mkESjLZW66TmHhiFX8MCaBjrhZ543PPh9a
Success! Txid is 4b45f3a1de2f63d0e78929f09f19a765d3a6be00b280cab82e63b065e405c323, index is 0
```

## 4 recoverBoomerang

### 4.1 get createboomerang unspend utxo

```
bcli getrawtransaction  4b45f3a1de2f63d0e78929f09f19a765d3a6be00b280cab82e63b065e405c323 1
```

output

```
{
  "txid": "4b45f3a1de2f63d0e78929f09f19a765d3a6be00b280cab82e63b065e405c323",
  "hash": "4b45f3a1de2f63d0e78929f09f19a765d3a6be00b280cab82e63b065e405c323",
  "version": 2,
  "size": 201,
  "vsize": 201,
  "weight": 804,
  "locktime": 0,
  "vin": [
    {
      "txid": "57bcebcbfe16f449cd75fe53378161ed53c4a49f846390f4af3728f95716d0c5",
      "vout": 0,
      "scriptSig": {
        "asm": "3045022100a8101659e1540439e6cb239869c64716dcc92f2cad60b3e1bcaf9fe00ff6515902207355d819c85f445e9f55d75edd4f605163b23fbbd592b387cbd2283b09a0fd8f[ALL] 039997a497d964fc1a62885b05a51166a65a90df00492c8d7cf61d6accf54803be",
        "hex": "483045022100a8101659e1540439e6cb239869c64716dcc92f2cad60b3e1bcaf9fe00ff6515902207355d819c85f445e9f55d75edd4f605163b23fbbd592b387cbd2283b09a0fd8f0121039997a497d964fc1a62885b05a51166a65a90df00492c8d7cf61d6accf54803be"
      },
      "sequence": 4294967295
    }
  ],
  "vout": [
    {
      "value": 0.99999700,
      "n": 0,
      "scriptPubKey": {
        "asm": "1 925fc11159ae4ac3f94479fff3b76ea271b777376f059151d1ef85991d40f13a",
        "desc": "rawtr(925fc11159ae4ac3f94479fff3b76ea271b777376f059151d1ef85991d40f13a)#d9prte4r",
        "hex": "5120925fc11159ae4ac3f94479fff3b76ea271b777376f059151d1ef85991d40f13a",
        "address": "bcrt1pjf0uzy2e4e9v872y08ll8dmw5fcmwaehduzez5w3a7zej82q7yaqm7pnca",
        "type": "witness_v1_taproot"
      }
    }
  ],
  "hex": "0200000001c5d01657f92837aff49063849fa4c453ed61813753fe75cd49f416fecbebbc57000000006b483045022100a8101659e1540439e6cb239869c64716dcc92f2cad60b3e1bcaf9fe00ff6515902207355d819c85f445e9f55d75edd4f605163b23fbbd592b387cbd2283b09a0fd8f0121039997a497d964fc1a62885b05a51166a65a90df00492c8d7cf61d6accf54803beffffffff01d4dff50500000000225120925fc11159ae4ac3f94479fff3b76ea271b777376f059151d1ef85991d40f13a00000000"
}
```

## 4.2 generate 120 block (if not gerate 100 + blocks, recoverBoomerang will report non-final)

```
bcli generatetoaddress 120 bcrt1q2zj2tdv8sjl4vqdhjcvyk5tysdjntgj74k6g5c
```

## 4.3 call recoverBoomerang

```
node dist/index.js -r 1 --amount  99999700 --utxo-txid=4b45f3a1de2f63d0e78929f09f19a765d3a6be00b280cab82e63b065e405c323 --utxo-index 0 --private-key 2bd806c97f0e00af1a1fc3328fa763a9269723c8db8fac4f93af71db186d6e90   --private-key-internal 1229101a0fcf2104e8808dab35661134aa5903867d44deb73ce1c7e4eb925be8  --lock-time 100
```

output

```
  ____                                                      ____ _ _
 | __ )  ___   ___  _ __ ___   ___ _ __ __ _ _ __   __ _   / ___| (_)
 |  _ \ / _ \ / _ \| '_ ` _ \ / _ \ '__/ _` | '_ \ / _` | | |   | | |
 | |_) | (_) | (_) | | | | | |  __/ | | (_| | | | | (_| | | |___| | |
 |____/ \___/ \___/|_| |_| |_|\___|_|  \__,_|_| |_|\__, |  \____|_|_|
                                                   |___/
## recoverBoomerang
### user address  mkESjLZW66TmHhiFX8MCaBjrhZ543PPh9a
Success! Txid is 5dbdb4cb6db01822d356ceef846cb1123bbd864b0465e53d8ee6c7450374efc2, index is 0
```
