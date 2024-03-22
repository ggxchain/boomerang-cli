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
    console.log(
      "### getRawTransaction error",
      error,
      error.response.data.error,
    );
  }
}

export async function getTransactionObject(txid: string) {
  const body = {
    jsonrpc: "1.0",
    method: "getrawtransaction",
    id: "getrawtx",
    params: [txid, 1],
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

export async function faucet(address: string, amount: number) {
  const body = {
    jsonrpc: "1.0",
    method: "sendtoaddress",
    id: "sendtoaddress",
    params: [
      address,
      amount / 1e8,
      "",
      "",
      false,
      false,
      null,
      "unset",
      false,
      1,
    ],
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
        console.log("### faucet response error: ", response.data.error);
      }
    }

    return response.data.result!;
  } catch (error: any) {
    console.log("### faucet error: ", error.code);
    console.log(
      "### faucet error error.response: ",
      // error.response,
      error.response.data.error,
    );
  }
}

export async function blockHeight(bestBlockHash: string) {
  const body = {
    jsonrpc: "1.0",
    method: "getblockheader",
    id: "getblockheader",
    params: [bestBlockHash],
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
        console.log("### blockHeight response error: ", response.data.error);
      }
    }

    return response.data.result.height;
  } catch (error: any) {
    console.log("### blockHeight error: ", bestBlockHash, error.code);
    console.log(
      "### blockHeight error error.response: ",
      // error.response,
      error.response.data.error,
    );
  }
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mine(count: number) {
  const body = {
    jsonrpc: "1.0",
    method: "generatetoaddress",
    id: "generatetoaddress",
    params: [count, "bcrt1q2zj2tdv8sjl4vqdhjcvyk5tysdjntgj74k6g5c"],
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
        console.log("### mine response error: ", response.data.error);
      }
    }

    //await timeout(5000);

    return response.data;
  } catch (error: any) {
    console.log("### mine error: ", error.code);
    console.log(
      "### mine error error.response: ",
      // error.response,
      error.response.data.error,
    );
  }
}

export async function bestBlockHash() {
  const body = {
    jsonrpc: "1.0",
    method: "getbestblockhash",
    id: "getbestblockhash",
    params: [],
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
        console.log(
          "### getbestblockhash response error: ",
          response.data.error,
        );
      }
    }

    return response.data.result;
  } catch (error: any) {
    console.log("### getbestblockhash error: ", error.code);
    console.log(
      "### getbestblockhash error error.response: ",
      // error.response,
      error.response.data.error,
    );
  }
}
