import { script, initEccLib, networks, payments, opcodes } from "bitcoinjs-lib";
import { describe, expect, test } from "@jest/globals";

import {
  faucet,
  blockHeight,
  mine,
  getTransactionObject,
  bestBlockHash,
} from "./blockstream_utils";

import {
  createBoomerangAmount,
  recoverLockAmount,
  ggxOrdinalScriptByCode,
  cltvScript,
  toXOnly,
} from "./locktime_tapscript";
import { Taptree } from "bitcoinjs-lib/src/types";

import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";

const ECPair = ECPairFactory(ecc);

const network = networks.regtest;

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
    const txid = await createBoomerangAmount(
      alice,
      unspent.txId,
      unspent.vout,
      unspent.value,
      lockTime,
      toXOnly(ggx.publicKey).toString("hex"),
      keypairInteranl,
      gas,
    );

    expect(txid).toBeTruthy();

    const unspentTxcreateBoomerangAmount = await getTransactionObject(txid);
    const v = unspentTxcreateBoomerangAmount.vout[0];

    const hashLockScript = cltvScript(alice, lockTime);
    const p2pkScript = ggxOrdinalScriptByCode(
      toXOnly(ggx.publicKey).toString("hex"),
      toXOnly(alice.publicKey).toString("hex"),
      toXOnly(alice.publicKey).toString("hex"),
    );

    const scriptTree: Taptree = [
      {
        output: hashLockScript,
      },
      {
        output: p2pkScript,
      },
    ];

    const scriptP2tr = payments.p2tr({
      internalPubkey: toXOnly(keypairInteranl.publicKey),
      scriptTree,
      network,
    });
    const scriptAddr = scriptP2tr.address ?? "";

    expect(v.n).toBe(0);
    expect(v.value).toBe((amount - gas) / 1e8);
    expect(v.scriptPubKey.address).toBe(scriptAddr);
    expect(v.scriptPubKey.type).toBe("witness_v1_taproot");
  });
});

// test recoverLockAmount
describe("recoverLockAmount", function () {
  it("can recoverLockAmount", async function () {
    const blockHash = await bestBlockHash();
    const height = await blockHeight(blockHash);

    const lockTime = height + 10;

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
    unspentCreateBoomerang.txId = txidCreateBoomerang;

    const newAmount = amount - gas;
    for (let index = 0; index < voutCreateBoomerang.length; index++) {
      const v = voutCreateBoomerang[index];

      if (newAmount / 1e8 == v.value) {
        unspentCreateBoomerang.vout = v.n;
        unspentCreateBoomerang.value = newAmount;
      }
    }

    let _first = await mine(5);
    await new Promise((r) => setTimeout(r, 5000));

    const txidNewMustFail = await recoverLockAmount(
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
    expect(txidNewMustFail).toBe(undefined);

    //const foo = true;
    let _ = await mine(5);
    await new Promise((r) => setTimeout(r, 5000));

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
  });
});
