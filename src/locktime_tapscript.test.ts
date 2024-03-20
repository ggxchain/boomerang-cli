import { initEccLib, networks, payments } from "bitcoinjs-lib";
import { describe, expect, test } from "@jest/globals";

import { faucet, height, mine } from "./blockstream_utils";

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
describe("createBoomerang", function () {
  it("can createBoomerang", async function () {
    const lockTime = 100;

    const aliceAddress = payments.p2pkh({
      pubkey: alice.publicKey,
      network: network,
    });

    const ggxAddress = payments.p2pkh({
      pubkey: ggx.publicKey,
      network: network,
    });

    expect(1).toBe(1);

    const unspent = await faucet(aliceAddress.address!, 1e5);
    console.log("### unspent", unspent);
    let unspentTx = await getRawTransaction(unspent);

    const keypairInteranl = ECPair.makeRandom({ network: network });

    const txid = await createBoomerangAmount(
      alice,
      unspent.txId,
      unspent.vout,
      unspent.value,
      lockTime,
      toXOnly(ggx.publicKey).toString("hex"),
      keypairInteranl,
    );

    expect(txid).toBe(null);
  });
});

// // test recoverLockAmount
// describe("recoverLockAmount", function () {
//   it("can recoverLockAmount", async function () {
//     const height = await regtestUtils.height();
//     const lockTime = height + 100;

//     const aliceAddress = payments.p2pkh({
//       pubkey: alice.publicKey,
//       network: network,
//     });

//     const ggxAddress = payments.p2pkh({
//       pubkey: ggx.publicKey,
//       network: network,
//     });

//     const unspent = await regtestUtils.faucet(aliceAddress.address!, 1e5);

//     const keypairInteranl = ECPair.makeRandom({ network: network });

//     const txidCreateBoomerang = await createBoomerangAmount(
//       alice,
//       unspent.txId,
//       unspent.vout,
//       unspent.value,
//       lockTime,
//       ggxAddress.address!,
//       keypairInteranl,
//     );

//     expect(txidCreateBoomerang).toBe(null);

//     const txCreateBoomerang = await regtestUtils.fetch(txidCreateBoomerang)!;
//     const txid = await recoverLockAmount(
//       alice,
//       txCreateBoomerang.txId,
//       0,
//       txCreateBoomerang.outs[0].value,
//       lockTime,
//       toXOnly(ggx.publicKey).toString("hex"),
//       aliceAddress.address!,
//       keypairInteranl,
//     );
//     expect(txid).toBe(null);

//     const txidNew = await recoverLockAmount(
//       alice,
//       txCreateBoomerang.txId,
//       0,
//       txCreateBoomerang.outs[0].value,
//       lockTime,
//       toXOnly(ggx.publicKey).toString("hex"),
//       aliceAddress.address!,
//       keypairInteranl,
//     );
//     expect(txidNew).toBe(null);
//   });
// });

// describe('findOrCreate method', () => {

//   it('should return an existing entry where one with same name exists without updating it', async () => {
//       expect(1 + 1).toEqual(2)
//   })
// })
