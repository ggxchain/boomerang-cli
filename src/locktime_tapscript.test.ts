import { initEccLib, networks, payments } from "bitcoinjs-lib";
import { describe, expect, test } from "@jest/globals";

import {
  faucet,
  blockHeight,
  mine,
  getRawTransaction,
  getTransactionObject,
  bestBlockHash,
} from "./blockstream_utils";

import {
  createBoomerangAmount,
  recoverLockAmount,
  toXOnly,
} from "./locktime_tapscript";

import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";

const ECPair = ECPairFactory(ecc);

const network = networks.testnet;

const alice = ECPair.fromWIF(
  "cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe",
  network,
);
const ggx = ECPair.fromWIF(
  "cMkopUXKWsEzAjfa1zApksGRwjVpJRB3831qM9W4gKZsLwjHXA9x",
  network,
);

// test createBoomerang
// describe("createBoomerang", function () {
//   it("can createBoomerang", async function () {
//     const lockTime = 100;

//     const aliceAddress = payments.p2pkh({
//       pubkey: alice.publicKey,
//       network: network,
//     });

//     const ggxAddress = payments.p2pkh({
//       pubkey: ggx.publicKey,
//       network: network,
//     });

//     expect(1).toBe(1);

//     const amount = 1e5;

//     const unspentTxid = await faucet(aliceAddress.address!, amount);
//     console.log("### unspent", unspentTxid);

//     const unspentTx = await getTransactionObject(unspentTxid);
//     const vout = unspentTx.vout;
//     let unspent: { [k: string]: any } = {};
//     unspent.txId = unspentTxid;

//     for (let index = 0; index < vout.length; index++) {
//       const v = vout[index];
//       if (amount / 1e8 == v.value) {
//         unspent.vout = v.n;
//         unspent.value = amount;
//       }
//     }

//     const keypairInteranl = ECPair.makeRandom({ network: network });

//     const gas = 300;
//     const txid = await createBoomerangAmount(
//       alice,
//       unspent.txId,
//       unspent.vout,
//       unspent.value,
//       lockTime,
//       toXOnly(ggx.publicKey).toString("hex"),
//       keypairInteranl,
//       gas,
//     );

//     expect(txid).toBeTruthy();//todo check tx info
//   });
// });

// test recoverLockAmount
describe("recoverLockAmount", function () {
  it("can recoverLockAmount", async function () {
    const blockHash = await bestBlockHash();
    const height = await blockHeight(blockHash);

    const lockTime = height + 100;

    const aliceAddress = payments.p2pkh({
      pubkey: alice.publicKey,
      network: network,
    });

    const ggxAddress = payments.p2pkh({
      pubkey: ggx.publicKey,
      network: network,
    });

    const amount = 1e5;

    const unspentTxid = await faucet(aliceAddress.address!, amount);

    const unspentTx = await getTransactionObject(unspentTxid);
    const vout = unspentTx.vout;
    let unspent: { [k: string]: any } = {};
    unspent.txId = unspentTxid;
    for (let index = 0; index < vout.length; index++) {
      const v = vout[index];
      if (amount / 1e8 == v.value) {
        unspent.vout = v.n;
        unspent.value = amount;
      }
    }

    const keypairInteranl = ECPair.makeRandom({ network: network });

    const gas = 300;
    const txidCreateBoomerang = await createBoomerangAmount(
      alice,
      unspent.txId,
      unspent.vout,
      unspent.value,
      lockTime,
      toXOnly(ggx.publicKey).toString("hex"),
      keypairInteranl,
      gas,
    );

    expect(txidCreateBoomerang).toBeTruthy();

    const txCreateBoomerang = await getTransactionObject(txidCreateBoomerang)!;
    const voutCreateBoomerang = txCreateBoomerang.vout;
    let unspentCreateBoomerang: { [k: string]: any } = {};
    unspentCreateBoomerang.txId = unspentTxid;

    const newAmount = amount - gas;
    for (let index = 0; index < voutCreateBoomerang.length; index++) {
      const v = voutCreateBoomerang[index];

      if (newAmount / 1e8 == v.value) {
        unspentCreateBoomerang.vout = v.n;
        unspentCreateBoomerang.value = newAmount;
      }
    }

    // const txid = await recoverLockAmount(
    //   alice,
    //   unspentCreateBoomerang.txId,
    //   unspentCreateBoomerang.vout,
    //   unspentCreateBoomerang.value,
    //   lockTime,
    //   toXOnly(ggx.publicKey).toString("hex"),
    //   aliceAddress.address!,
    //   keypairInteranl,
    //   gas,
    // );
    // expect(txid).toBe(undefined);

    let _ = await mine(100);
    

    setTimeout(async () => {

      try {
        const txidNew = await recoverLockAmount(
          alice,
          unspentCreateBoomerang.txId,
          unspentCreateBoomerang.vout,
          unspentCreateBoomerang.value,
          lockTime,
          toXOnly(ggx.publicKey).toString("hex"),
          aliceAddress.address!,
          keypairInteranl,
          gas,
        );
        expect(txidNew).toBeTruthy();
        done();
      } catch(e) {
        //done.fail(e);
      }
    }, 10000);


  });
});
