import {
  initEccLib,
  networks,
  script,
  Signer,
  payments,
  crypto,
  Psbt,
  Payment,
} from "bitcoinjs-lib";
import { broadcast, getRawTransaction } from "./blockstream_utils";
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from "ecpair";
import { Taptree } from "bitcoinjs-lib/src/types";

const tinysecp: TinySecp256k1Interface = require("tiny-secp256k1");
initEccLib(tinysecp as any);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);
const network = networks.regtest;

function tweakSigner(signer: Signer, opts: any = {}): Signer {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let privateKey: Uint8Array | undefined = signer.privateKey!;
  if (!privateKey) {
    throw new Error("Private key is required for tweaking signer!");
  }
  if (signer.publicKey[0] === 3) {
    privateKey = tinysecp.privateNegate(privateKey);
  }

  const tweakedPrivateKey = tinysecp.privateAdd(
    privateKey,
    tapTweakHash(toXOnly(signer.publicKey), opts.tweakHash),
  );
  if (!tweakedPrivateKey) {
    throw new Error("Invalid tweaked private key!");
  }

  return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
    network: opts.network,
  });
}

function tapTweakHash(pubKey: Buffer, h: Buffer | undefined): Buffer {
  return crypto.taggedHash(
    "TapTweak",
    Buffer.concat(h ? [pubKey, h] : [pubKey]),
  );
}

export function toXOnly(pubkey: Buffer): Buffer {
  return pubkey.subarray(1, 33);
}

export function cltvCheckSigOutput(aQ: Signer, lockTime: number) {
  //console.log("### locktime pubkey: ", aQ.publicKey.toString("hex"), toXOnly(aQ.publicKey).toString("hex"));
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

export async function createBoomerangAmount(
  keypairUser: Signer,
  utxoTxid: string,
  utxoIndex: number,
  amount: number,
  lockTime: number,
  ggxPublicKey: string,
  keypairInternal: Signer,
) {
  // Create a tap tree with two spend paths
  // One path should allow spending using secret
  // The other path should pay to another pubkey

  const hashLockScript = cltvCheckSigOutput(keypairUser, lockTime);

  const p2pkScriptAsm = `${ggxPublicKey} OP_CHECKSIG`;
  //todo use ggx public key
  //const p2pkScript_asm = `${toXOnly(keypair.publicKey).toString('hex')} OP_CHECKSIG OP_FALSE OP_IF OP_3 6f7264 OP_1 1 0x1e 6170706c69636174696f6e2f6a736f6e3b636861727365743d7574662d38 OP_1 5 0x4b   7b73656e6465723a20223465646663663964666536633062356338336431616233663738643162333961343665626163363739386530386531393736316635656438396563383363313022 OP_ENDIF`;
  const p2pkScript = script.fromASM(p2pkScriptAsm);

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
  console.log(scriptAddr);

  const rawTx = await getRawTransaction(utxoTxid);
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: utxoTxid,
    index: utxoIndex,
    nonWitnessUtxo: Buffer.from(rawTx, "hex"),
  });

  psbt.addOutput({
    address: scriptAddr, // faucet address
    value: amount - 300,
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
) {
  const hashLockScript = cltvCheckSigOutput(keypair, lockTime);
  const p2pkScriptAsm = `${ggxPublicKey} OP_CHECKSIG`;

  //todo use ggx public key
  //const p2pkScriptAsm = `${toXOnly(keypair.publicKey).toString('hex')} OP_CHECKSIG OP_FALSE OP_IF OP_3 6f7264 OP_1 1 0x1e 6170706c69636174696f6e2f6a736f6e3b636861727365743d7574662d38 OP_1 5 0x4b   7b73656e6465723a20223465646663663964666536633062356338336431616233663738643162333961343665626163363739386530386531393736316635656438396563383363313022 OP_ENDIF`;
  const p2pkScript = script.fromASM(p2pkScriptAsm);

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

  console.log("### hash_lock_p2tr.output", hash_lock_p2tr.output, amount);

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
    value: amount - 300,
  });

  // We need to create a signer tweaked by script tree's merkle root
  psbt.signInput(0, keypair);
  psbt.finalizeInput(0);

  const tx = psbt.extractTransaction();
  //console.log("### tx is ", tx.toHex());
  const txid = (await broadcast(tx.toHex()))?.result;
  console.log(`Success! Txid is ${txid}, index is 0`);
  return txid;
}
