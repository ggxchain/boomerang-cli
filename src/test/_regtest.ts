import { RegtestUtils } from "regtest-client";

const APIPASS = process.env.APIPASS || "rpcpassword";
const APIURL = process.env.APIURL || "http://localhost:18332";

export const regtestUtils = new RegtestUtils({ APIPASS, APIURL });
