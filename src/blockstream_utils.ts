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

export async function faucet(address: string, amout: number) {
  const body = {
    jsonrpc: "1.0",
    method: "sendtoaddress",
    id: "sendtoaddress",
    params: [
      address,
      amout / 1e8,
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

export async function height() {
  const body = {
    jsonrpc: "1.0",
    method: "getblockheader",
    id: "getblockheader",
    params: [true],
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
        console.log("### height response error: ", response.data.error);
      }
    }

    return response.data.height;
  } catch (error: any) {
    console.log("### height error: ", error.code);
    console.log(
      "### height error error.response: ",
      // error.response,
      error.response.data.error,
    );
  }
}

export async function mine(count: number) {
  const body = {
    jsonrpc: "1.0",
    method: "generatetoaddress",
    id: "generatetoaddress",
    params: [count, "bcrt1qg4xrdyf0dzc26y39zyzkajleww5z0hgzvzl9fj"],
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

    return response.data.height;
  } catch (error: any) {
    console.log("### mine error: ", error.code);
    console.log(
      "### mine error error.response: ",
      // error.response,
      error.response.data.error,
    );
  }
}
