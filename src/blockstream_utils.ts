import axios from "axios";

const APIPASS = process.env.APIPASS || "rpcpassword";
const APIURL = process.env.APIURL || "http://localhost:18332";

export async function broadcast(txHex: string) {
  const body = {
    jsonrpc: "1.0",
    method: "sendrawtransaction",
    id: "sendrawtx",
    params: [txHex],
  };

  try {
    const response = await axios.post(APIURL, body, {
      auth: {
        username: "rpcuser",
        password: APIPASS,
      },
    });

    if (response.data != null) {
      if (response.data.result == null) {
        console.log("### broadcast response error: ", response.data.error);
      }
    }

    return response.data;
  } catch (error: any) {
    console.log("### broadcast error: ", error.code);
    console.log(
      "### broadcast error error.response: ",
      // error.response,
      error.response.data.error,
    );
  }
}

export async function getBalance() {
  const body = {
    jsonrpc: "1.0",
    method: "getbalance",
    id: "getbalance",
    params: ["*", 6],
  };

  try {
    const response = await axios.post(APIURL, body, {
      auth: {
        username: "rpcuser",
        password: APIPASS,
      },
    });

    return response.data;
  } catch (error: any) {
    console.log("### getBalance error", error);
  }
}

export async function getRawTransaction(txid: string) {
  const body = {
    jsonrpc: "1.0",
    method: "getrawtransaction",
    id: "getrawtx",
    params: [txid],
  };

  try {
    const response = await axios.post(APIURL, body, {
      auth: {
        username: "rpcuser",
        password: APIPASS,
      },
    });

    return response.data.result;
  } catch (error: any) {
    console.log("### getRawTransaction error", error);
  }
}
