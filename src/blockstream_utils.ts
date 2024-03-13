import axios from "axios";

export async function broadcast(txHex: string) {
  const body = {
    jsonrpc: "1.0",
    method: "sendrawtransaction",
    id: "curlrawtx",
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
    console.log("### broadcast response error ??: ", response.data.error);

    return response;
  } catch (error: any) {
    console.log("### broadcast error: ", error, error.code);
    console.log(
      "### broadcast error error.response: ",
      error.response,
      error.response.data.error,
    );
  }
}

export async function get_balance() {
  const body = {
    jsonrpc: "1.0",
    method: "getbalance",
    id: "curltext",
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
