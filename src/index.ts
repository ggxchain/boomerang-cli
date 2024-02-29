const { Command } = require("commander"); // add this line
const figlet = require("figlet");

//add the following line
const program = new Command();

program
  .version("1.0.0")
  .description("An CLI for Boomerang UTXO")
  .option("-h, --help", "List All Command")
  .option("-c, --create-boomerang <AMOUNT>", "Creates a boomerang UTXO and submits it to GGx and Bitcoin")
  .option("-r, --recover-boomerang <UTXID>", "Spends a boomerang UTXO that has passed its timelock")
  .option("-l, --list-boomerangs <SECP256k1 PUBKEY>", "Queries GGx chain for boomerang UTXOs that are either confirmed or in the Bitcoin mempool")
  .parse(process.argv);

const options = program.opts();

if (options.createBoomerang) {
  createBoomerang()
}

if (options.recoverBoomerang) {
  recoverBoomerang()
}
if (options.listBoomerangs) {
  listBoomerangs()
}
//define the following function
async function createBoomerang() {
  try {
    console.log("## createBoomerang");
  } catch (error) {
    console.error("Error occurred while create boomerang!", error);
  }
}

async function recoverBoomerang() {
  try {
    console.log("## recoverBoomerang");
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

console.log(figlet.textSync("Boomerang Cli"));