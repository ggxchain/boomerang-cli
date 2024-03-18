import axios from "axios";

export async function broadcast(txHex: string) {
  const body = {
    jsonrpc: "1.0",
    method: "sendrawtransaction",
    id: "sendrawtx",
    params: [txHex],
  };

  const port = 18332;
  try {
    const response = await axios.post(`http://127.0.0.1:${port}/`, body, {
      auth: {
        username: "rpcuser",
        password: "rpcpassword",
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

export async function get_balance() {
  const body = {
    jsonrpc: "1.0",
    method: "getbalance",
    id: "getbalance",
    params: ["*", 6],
  };
  const port = 18332;

  try {
    const response = await axios.post(`http://127.0.0.1:${port}/`, body, {
      auth: {
        username: "rpcuser",
        password: "rpcpassword",
      },
    });

    return response.data;
  } catch (error: any) {
    console.log("### get_balance error", error);
  }
}

export async function get_rawtransaction(txid: string) {
  const body = {
    jsonrpc: "1.0",
    method: "getrawtransaction",
    id: "getrawtx",
    params: [txid],
  };
  const port = 18332;

  try {
    const response = await axios.post(`http://127.0.0.1:${port}/`, body, {
      auth: {
        username: "rpcuser",
        password: "rpcpassword",
      },
    });

    return response.data.result;
  } catch (error: any) {
    console.log("### get_rawtransaction error", error);
  }
}
