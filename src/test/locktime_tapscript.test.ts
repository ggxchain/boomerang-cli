import { expect } from "chai";
import { initEccLib, networks, payments } from "bitcoinjs-lib";
import { RegtestUtils } from "regtest-client";

import {
  createBoomerangAmount,
  recoverLockAmount,
  toXOnly,
} from "../locktime_tapscript";

import ECPairFactory from "ecpair";
import * as ecc from "tiny-secp256k1";
import internal from "stream";
const ECPair = ECPairFactory(ecc);

const APIPASS = process.env.APIPASS || "rpcpassword";
const APIURL = process.env.APIURL || "http://localhost:18332";

const regtestUtils = new RegtestUtils({ APIPASS, APIURL });

const regtest = regtestUtils.network;

const alice = ECPair.fromWIF(
  "cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe",
  regtest,
);
const ggx = ECPair.fromWIF(
  "cMkopUXKWsEzAjfa1zApksGRwjVpJRB3831qM9W4gKZsLwjHXA9x",
  regtest,
);

// test createBoomerang
describe("createBoomerang", function () {
  it("can createBoomerang", async function () {
    const lockTime = 100;

    const aliceAddress = payments.p2pkh({
      pubkey: alice.publicKey,
      network: regtest,
    });

    const ggxAddress = payments.p2pkh({
      pubkey: alice.publicKey,
      network: regtest,
    });

    const unspent = await regtestUtils.faucet(aliceAddress.address!, 1e5);
    const keypairInteranl = ECPair.makeRandom({ network: regtest });

    const txid = await createBoomerangAmount(
      alice,
      unspent.txId,
      unspent.vout,
      unspent.value,
      lockTime,
      ggxAddress.address!,
      keypairInteranl,
    );

    expect(txid).to.not.be.equal(null);
  });
});

// test recoverLockAmount
describe("recoverLockAmount", function () {
  it("can recoverLockAmount", async function () {
    const height = await regtestUtils.height();
    const lockTime = height + 100;

    const aliceAddress = payments.p2pkh({
      pubkey: alice.publicKey,
      network: regtest,
    });

    const ggxAddress = payments.p2pkh({
      pubkey: ggx.publicKey,
      network: regtest,
    });

    const unspent = await regtestUtils.faucet(aliceAddress.address!, 1e5);

    const keypairInteranl = ECPair.makeRandom({ network: regtest });

    const txidCreateBoomerang = await createBoomerangAmount(
      alice,
      unspent.txId,
      unspent.vout,
      unspent.value,
      lockTime,
      ggxAddress.address!,
      keypairInteranl,
    );

    expect(txidCreateBoomerang).to.not.be.equal(null);

    const txCreateBoomerang = await regtestUtils.fetch(txidCreateBoomerang)!;
    const txid = await recoverLockAmount(
      alice,
      txCreateBoomerang.txId,
      0,
      txCreateBoomerang.outs[0].value,
      lockTime,
      toXOnly(ggx.publicKey).toString("hex"),
      aliceAddress.address!,
      keypairInteranl,
    );
    expect(txid).to.be.equal(null);

    const txidNew = await recoverLockAmount(
      alice,
      txCreateBoomerang.txId,
      0,
      txCreateBoomerang.outs[0].value,
      lockTime,
      toXOnly(ggx.publicKey).toString("hex"),
      aliceAddress.address!,
      keypairInteranl,
    );
    expect(txidNew).to.not.be.equal(null);
  });
});
