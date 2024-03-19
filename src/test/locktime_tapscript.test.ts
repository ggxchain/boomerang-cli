import { expect } from "chai";
import { initEccLib, networks, payments } from "bitcoinjs-lib";
import { RegtestUtils } from "regtest-client";

import { create_boomerang, recover_lock_amount } from "../locktime_tapscript";

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

// test create_boomerang
describe("create_boomerang", function () {
  it("can create_boomerang", async function () {
    const lock_time = 100;

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

    const txid = await create_boomerang(
      alice,
      ggx,
      unspent.txId,
      unspent.vout,
      unspent.value,
      lock_time,
      ggxAddress.address!,
      keypairInteranl,
    );

    expect(txid).to.not.be.equal(null);
  });
});

// test recover_lock_amount
describe("recover_lock_amount", function () {
  it("can recover_lock_amount", async function () {
    const height = await regtestUtils.height();
    const lock_time = height + 100;

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

    const txidCreateBoomerang = await create_boomerang(
      alice,
      ggx,
      unspent.txId,
      unspent.vout,
      unspent.value,
      lock_time,
      ggxAddress.address!,
      keypairInteranl,
    );

    expect(txidCreateBoomerang).to.not.be.equal(null);

    const txCreateBoomerang = await regtestUtils.fetch(txidCreateBoomerang)!;
    const txid = await recover_lock_amount(
      alice,
      ggx,
      txCreateBoomerang.txId,
      0,
      txCreateBoomerang.outs[0].value,
      lock_time,
      ggxAddress.address!,
      keypairInteranl,
    );
    expect(txid).to.be.equal(null);

    const txidNew = await recover_lock_amount(
      alice,
      ggx,
      txCreateBoomerang.txId,
      0,
      txCreateBoomerang.outs[0].value,
      lock_time,
      ggxAddress.address!,
      keypairInteranl,
    );
    expect(txidNew).to.not.be.equal(null);
  });
});
