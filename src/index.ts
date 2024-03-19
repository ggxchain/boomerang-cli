const { Command } = require("commander"); // add this line
const figlet = require("figlet");

import { initEccLib, networks, payments } from "bitcoinjs-lib";

import { ECPairFactory, ECPairAPI } from "ecpair";

import { create_boomerang, recover_lock_amount } from "./locktime_tapscript";

import tinysecp = require("tiny-secp256k1");
initEccLib(tinysecp as any);
const ECPair: ECPairAPI = ECPairFactory(tinysecp);

const network = networks.testnet;

//add the following line
const program = new Command();

async function main() {
  console.log(figlet.textSync("Boomerang Cli"));

  function my_parse_int(value: any) {
    // parseInt takes a string and a radix
    const parsedValue: number = parseInt(value, 10);
    if (isNaN(parsedValue)) {
      throw new Command.InvalidArgumentError("Not a number.");
    }
    return parsedValue;
  }

  program
    .version("1.0.0")
    .description("An CLI for Boomerang UTXO")
    .option("-h, --help", "List All Command")
    .option(
      "-c, --create-boomerang",
      "Creates a boomerang UTXO and submits it to GGx and Bitcoin, with params <AMOUNT> <PRE_UTXOID> <PRIVATE KEY>",
    )
    .option(
      "-r, --recover-boomerang <UTXID>",
      "Spends a boomerang UTXO that has passed its timelock",
    )
    .option(
      "-l, --list-boomerangs <SECP256k1 PUBKEY>",
      "Queries GGx chain for boomerang UTXOs that are either confirmed or in the Bitcoin mempool",
    )
    .option("-a, --amount <amount>", "integer argument", my_parse_int)
    .option("-t, --utxo-txid <txid>")
    .option("-i, --utxo-index <index>", "integer argument", my_parse_int)
    .option("-p, --private-key <key>")
    .option("-pi, --private-key-internal <key-internal>")
    .option("-pggx, --private-key-ggx <key-ggx>")
    .option("-lo, --lock-time <lock>", "integer argument", my_parse_int)
    .parse(process.argv);

  const options = program.opts();

  //define the following function
  async function createBoomerang() {
    try {
      console.log(
        "## createBoomerang",
        options.privateKey,
        options.utxoTxid,
        options.utxoIndex,
        options.amount,
        options.lockTime,
      );

      let privateKeyBuffer = Buffer.from(options.privateKey, "hex");
      let privateKeyBufferInternal = Buffer.from(
        options.privateKeyInternal,
        "hex",
      );
      let privateKeyBufferGgx = Buffer.from(options.privateKeyGgx, "hex");
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
        network: network,
      });
      const keyPairInteranl = ECPair.fromPrivateKey(privateKeyBufferInternal, {
        network: network,
      });
      const keyPairGgx = ECPair.fromPrivateKey(privateKeyBufferGgx, {
        network: network,
      });

      console.log("#### keyPair", keyPair.publicKey);

      const { address } = payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: networks.regtest,
      });
      console.log("@@@@ user address ", address);

      await create_boomerang(
        keyPair,
        keyPairGgx,
        options.utxoTxid,
        options.utxoIndex,
        options.amount,
        options.lockTime,
        "bcrt1qg4xrdyf0dzc26y39zyzkajleww5z0hgzvzl9fj", //ggx address
        keyPairInteranl,
      );
    } catch (error) {
      console.error("Error occurred while create boomerang!", error);
    }
  }

  async function recoverBoomerang() {
    try {
      console.log("## recoverBoomerang");

      let privateKeyBuffer = Buffer.from(options.privateKey, "hex");
      let privateKeyBufferInternal = Buffer.from(
        options.privateKeyInternal,
        "hex",
      );
      let privateKeyBufferGgx = Buffer.from(options.privateKeyGgx, "hex");
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
        network: network,
      });
      const keyPairInteranl = ECPair.fromPrivateKey(privateKeyBufferInternal, {
        network: network,
      });
      const keyPairGgx = ECPair.fromPrivateKey(privateKeyBufferGgx, {
        network: network,
      });

      console.log("#### keyPair", keyPair.publicKey);

      const { address } = payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: networks.regtest,
      });
      console.log("@@@@ user address ", address);

      await recover_lock_amount(
        keyPair,
        keyPairGgx,
        options.utxoTxid,
        options.utxoIndex,
        options.amount,
        options.lockTime,
        address!,
        keyPairInteranl,
      );
    } catch (error) {
      console.error("Error occurred while recover boomerang!", error);
    }
  }

  async function listBoomerangs() {
    try {
      console.log("## listBoomerangs");
    } catch (error) {
      console.error("Error occurred while list boomerangs!", error);
    }
  }

  if (options.createBoomerang) {
    console.log();
    await createBoomerang();
  }

  if (options.recoverBoomerang) {
    await recoverBoomerang();
  }
  if (options.listBoomerangs) {
    await listBoomerangs();
  }
}

(async () => {
  try {
    await main();
  } catch (e: any) {
    // Deal with the fact the chain failed
    console.log("## bomerang-cli error:", e);
  }
  // `text` is not available here
})();
