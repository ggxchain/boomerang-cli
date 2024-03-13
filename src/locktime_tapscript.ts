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
import { broadcast } from "./blockstream_utils";
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from "ecpair";
import { Taptree } from "bitcoinjs-lib/src/types";

const tinysecp: TinySecp256k1Interface = require("tiny-secp256k1");
initEccLib(tinysecp as any);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);
const network = networks.regtest;

const LEAF_VERSION_TAPSCRIPT = 192;

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

function cltvCheckSigOutput(aQ: Signer, lockTime: number) {
  return script.fromASM(
    `
            ${script.number.encode(lockTime).toString("hex")}
            OP_CHECKLOCKTIMEVERIFY
            OP_DROP
            ${aQ.publicKey.toString("hex")}
            OP_CHECKSIG
      `
      .trim()
      .replace(/\s+/g, " "),
  );
}

export async function start_taptree(
  keypair: Signer,
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
  // Construct script to pay to hash_lock_keypair if the correct preimage/secret is provided

  const hash_lock_script = cltvCheckSigOutput(keypair, lock_time); //script.fromASM(hash_script_asm); // todo use user keypair

  const p2pk_script_asm = `${toXOnly(keypair.publicKey).toString("hex")} OP_CHECKSIG`;
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

  const redeem = {
    output: hash_lock_script,
    redeemVersion: LEAF_VERSION_TAPSCRIPT,
  };

  const { output, witness } = payments.p2tr({
    internalPubkey: toXOnly(keypair_internal.publicKey),
    scriptTree,
    redeem,
    network: network,
  });

  const psbt = new Psbt({ network: network });
  psbt.addInput({
    hash: utxo_txid,
    index: utxo_index,
    sequence: 10,
    witnessUtxo: { value: amount, script: output! },
  });
  psbt.updateInput(0, {
    tapLeafScript: [
      {
        leafVersion: redeem.redeemVersion,
        script: redeem.output,
        controlBlock: witness![witness!.length - 1],
      },
    ],
  });

  const sendPubKey = toXOnly(keypair.publicKey);
  const { address: sendAddress } = payments.p2tr({
    internalPubkey: sendPubKey,
    scriptTree,
    network: network,
  });

  psbt.addOutput({ value: amount - 150, address: sendAddress! });

  //   psbt.updateOutput(0, {
  //     tapInternalKey: sendPubKey,
  //     tapTree: { leaves: tapTreeToList(scriptTree) },
  //   });

  await psbt.signInputAsync(0, keypair);
  psbt.finalizeInput(0);

  const tx = psbt.extractTransaction();
  console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
  const txid = await broadcast(tx.toHex());
  console.log(`Success! Txid is ${txid}`);
}

export async function recover_lock_amount(
  keypair: Signer,
  utxo_txid: string,
  utxo_index: number,
  amount: number,
  script_p2tr: Payment,
  recive_address: string,
) {
  const key_spend_psbt = new Psbt({ network });
  key_spend_psbt.addInput({
    hash: utxo_txid,
    index: utxo_index,
    witnessUtxo: { value: amount, script: script_p2tr.output! },
    tapInternalKey: toXOnly(keypair.publicKey),
    tapMerkleRoot: script_p2tr.hash,
  });
  key_spend_psbt.addOutput({
    address: recive_address, //"bcrt1qg4xrdyf0dzc26y39zyzkajleww5z0hgzvzl9fj", // faucet address, todo replace to recive_address
    value: amount - 150,
  });
  // We need to create a signer tweaked by script tree's merkle root
  const tweakedSigner = tweakSigner(keypair, { tweakHash: script_p2tr.hash });
  key_spend_psbt.signInput(0, tweakedSigner);
  key_spend_psbt.finalizeAllInputs();

  const tx = key_spend_psbt.extractTransaction();
  console.log(`Broadcasting Transaction Hex: ${tx.toHex()}`);
  const txid = await broadcast(tx.toHex());
  console.log(`Success! Txid is ${txid}`);
}
