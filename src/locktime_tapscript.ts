import {
  initEccLib,
  networks,
  script,
  Signer,
  payments,
  crypto,
  Psbt,
  Payment,
  opcodes,
} from "bitcoinjs-lib";
import { broadcast, getRawTransaction } from "./blockstream_utils";
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from "ecpair";
import { Taptree } from "bitcoinjs-lib/src/types";

const tinysecp: TinySecp256k1Interface = require("tiny-secp256k1");
initEccLib(tinysecp as any);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);
const network = networks.regtest;

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return crypto.taggedHash(
    "TapTweak",
    Buffer.concat(h ? [pubKey, h] : [pubKey]),
  );
}

export function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33);
}

export function cltvScript(aQ: Signer, lockTime: number) {
  return script.fromASM(
    `
            ${script.number.encode(lockTime).toString("hex")}
            OP_CHECKLOCKTIMEVERIFY
            OP_DROP
            ${toXOnly(aQ.publicKey).toString("hex")}
            OP_CHECKSIG
      `
      .trim()
      .replace(/\s+/g, " "),
  );
}

export function ggxOrdinalScriptByCode(
  strPublicKey: string,
  sender: string,
  receiver: string,
) {
  const inscription = `{sender: ${sender},  receiver: ${receiver} }`;

  // make the script output
  var s = script.compile([
    opcodes.OP_FALSE,
    opcodes.OP_IF,
    opcodes.OP_PUSH,
    Buffer.from("ord", "utf8"), // doge labs uses this to identify the inscription
    opcodes.OP_PUSH,
    Buffer.from("1", "utf8"),
    opcodes.OP_PUSH,
    Buffer.from("application/json;charset=utf-8", "utf8"),
    opcodes.OP_PUSH,
    Buffer.from("0", "utf8"),
    opcodes.OP_PUSH,
    Buffer.from(inscription, "utf8"), // our actual text inscription
    opcodes.OP_ENDIF,
  ]);

  return s;
}

export async function createBoomerangAmount(
  keypairUser: Signer,
  utxoTxid: string,
  utxoIndex: number,
  amount: number,
  lockTime: number,
  ggxPublicKey: string,
  keypairInternal: Signer,
  gas: number,
) {
  // Create a tap tree with two spend paths
  // One path should allow spending using secret
  // The other path should pay to another pubkey

  const hashLockScript = cltvScript(keypairUser, lockTime);
  const p2pkScript = ggxOrdinalScriptByCode(
    ggxPublicKey,
    toXOnly(keypairUser.publicKey).toString("hex"),
    toXOnly(keypairUser.publicKey).toString("hex"),
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
    internalPubkey: toXOnly(keypairInternal.publicKey),
    scriptTree,
    network,
  });
  const scriptAddr = scriptP2tr.address ?? "";

  const rawTx = await getRawTransaction(utxoTxid);
  const psbt = new Psbt({ network });

  psbt.addInput({
    hash: utxoTxid,
    index: utxoIndex,
    nonWitnessUtxo: Buffer.from(rawTx, "hex"),
  });

  psbt.addOutput({
    address: scriptAddr,
    value: amount - gas,
  });

  psbt.signInput(0, keypairUser);
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  const txid = (await broadcast(tx.toHex()))?.result;
  console.log(`Success! Txid is ${txid}, index is 0`);

  return txid;
}

export async function recoverLockAmount(
  keypair: Signer,
  utxoTxid: string,
  utxoIndex: number,
  amount: number,
  lockTime: number,
  ggxPublicKey: string,
  reciveAddress: string,
  keypairInternal: Signer,
  gas: number,
) {
  const hashLockScript = cltvScript(keypair, lockTime);
  const p2pkScript = ggxOrdinalScriptByCode(
    ggxPublicKey,
    toXOnly(keypair.publicKey).toString("hex"),
    toXOnly(keypair.publicKey).toString("hex"),
  );

  const scriptTree: Taptree = [
    {
      output: hashLockScript,
    },
    {
      output: p2pkScript,
    },
  ];

  const hashLockRedeem = {
    output: hashLockScript,
    redeemVersion: 192,
  };

  const hash_lock_p2tr = payments.p2tr({
    internalPubkey: toXOnly(keypairInternal.publicKey),
    scriptTree,
    redeem: hashLockRedeem,
    network,
  });

  const tapLeafScript = {
    leafVersion: hashLockRedeem.redeemVersion,
    script: hashLockRedeem.output,
    controlBlock: hash_lock_p2tr.witness![hash_lock_p2tr.witness!.length - 1],
  };

  const psbt = new Psbt({ network });

  psbt.setLocktime(lockTime);

  psbt.addInput({
    hash: utxoTxid,
    index: utxoIndex,
    witnessUtxo: { script: hash_lock_p2tr.output!, value: amount },
    tapLeafScript: [tapLeafScript],
    sequence: 0xfffffffe,
  });
  psbt.addOutput({
    address: reciveAddress,
    value: amount - gas,
  });

  // We need to create a signer tweaked by script tree's merkle root
  psbt.signInput(0, keypair);
  psbt.finalizeInput(0);

  const tx = psbt.extractTransaction();
  const txid = (await broadcast(tx.toHex()))?.result;
  console.log(`Success! Txid is ${txid}, index is 0`);
  return txid;
}
