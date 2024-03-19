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
import { broadcast, get_rawtransaction } from "./blockstream_utils";
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

function toXOnly(pubkey: Buffer): Buffer {
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

export async function create_boomerang(
  keypair_user: Signer,
  keypair_ggx: Signer,
  utxo_txid: string,
  utxo_index: number,
  amount: number,
  lock_time: number,
  ggx_address: string,
  keypair_internal: Signer,
) {
  // Create a tap tree with two spend paths
  // One path should allow spending using secret
  // The other path should pay to another pubkey

  console.log(
    "@@ script.number.encode(lock_time).toString('hex')",
    script.number.encode(lock_time).toString("hex"),
  );
  const hash_lock_script = cltvCheckSigOutput(keypair_user, lock_time);

  const p2pk_script_asm = `${toXOnly(keypair_ggx.publicKey).toString("hex")} OP_CHECKSIG`;
  //todo use ggx public key
  //const p2pk_script_asm = `${toXOnly(keypair.publicKey).toString('hex')} OP_CHECKSIG OP_FALSE OP_IF OP_3 6f7264 OP_1 1 0x1e 6170706c69636174696f6e2f6a736f6e3b636861727365743d7574662d38 OP_1 5 0x4b   7b73656e6465723a20223465646663663964666536633062356338336431616233663738643162333961343665626163363739386530386531393736316635656438396563383363313022 OP_ENDIF`;
  const p2pk_script = script.fromASM(p2pk_script_asm);

  const scriptTree: Taptree = [
    {
      output: hash_lock_script,
    },
    {
      output: p2pk_script,
    },
  ];

  const script_p2tr = payments.p2tr({
    internalPubkey: toXOnly(keypair_internal.publicKey),
    scriptTree,
    network,
  });
  const script_addr = script_p2tr.address ?? "";
  console.log(script_addr);

  const raw_tx = await get_rawtransaction(utxo_txid);
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: utxo_txid,
    index: utxo_index,
    nonWitnessUtxo: Buffer.from(raw_tx, "hex"),
  });

  psbt.addOutput({
    address: script_addr, // faucet address
    value: amount - 300,
  });

  psbt.signInput(0, keypair_user);
  psbt.finalizeAllInputs();

  const tx = psbt.extractTransaction();
  const txid = (await broadcast(tx.toHex()))?.result;
  console.log(`Success! Txid is ${txid}, index is 0`);

  return txid;
}

export async function recover_lock_amount(
  keypair: Signer,
  keypair_ggx: Signer,
  utxo_txid: string,
  utxo_index: number,
  amount: number,
  lock_time: number,
  recive_address: string,
  keypair_internal: Signer,
) {
  const hash_lock_script = cltvCheckSigOutput(keypair, lock_time);
  const p2pk_script_asm = `${toXOnly(keypair_ggx.publicKey).toString("hex")} OP_CHECKSIG`;

  //todo use ggx public key
  //const p2pk_script_asm = `${toXOnly(keypair.publicKey).toString('hex')} OP_CHECKSIG OP_FALSE OP_IF OP_3 6f7264 OP_1 1 0x1e 6170706c69636174696f6e2f6a736f6e3b636861727365743d7574662d38 OP_1 5 0x4b   7b73656e6465723a20223465646663663964666536633062356338336431616233663738643162333961343665626163363739386530386531393736316635656438396563383363313022 OP_ENDIF`;
  const p2pk_script = script.fromASM(p2pk_script_asm);

  const scriptTree: Taptree = [
    {
      output: hash_lock_script,
    },
    {
      output: p2pk_script,
    },
  ];

  const hash_lock_redeem = {
    output: hash_lock_script,
    redeemVersion: 192,
  };

  const hash_lock_p2tr = payments.p2tr({
    internalPubkey: toXOnly(keypair_internal.publicKey),
    scriptTree,
    redeem: hash_lock_redeem,
    network,
  });

  const tapLeafScript = {
    leafVersion: hash_lock_redeem.redeemVersion,
    script: hash_lock_redeem.output,
    controlBlock: hash_lock_p2tr.witness![hash_lock_p2tr.witness!.length - 1],
  };

  const psbt = new Psbt({ network });

  console.log("### hash_lock_p2tr.output", hash_lock_p2tr.output, amount);

  psbt.setLocktime(lock_time);
  psbt.addInput({
    hash: utxo_txid,
    index: utxo_index,
    witnessUtxo: { script: hash_lock_p2tr.output!, value: amount },
    tapLeafScript: [tapLeafScript],
    sequence: 0xfffffffe,
  });
  psbt.addOutput({
    address: recive_address,
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
