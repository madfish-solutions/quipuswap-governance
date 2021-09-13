const { MichelsonMap } = require("@taquito/michelson-encoder");

const { alice, bob } = require("../scripts/sandbox/accounts");
const env = process.env;

const metadata = MichelsonMap.fromLiteral({
  "": Buffer.from("tezos-storage:gov", "ascii").toString("hex"),
  gov: Buffer.from(
    JSON.stringify({
      version: "v1.0.0",
      description: "Quipuswap Governance Token",
      authors: ["Madfish.Solutions"],
      source: {
        tools: ["Ligo", "Flextesa"],
        location: "https://ligolang.org/",
      },
      interfaces: ["TZIP-12", "TZIP-16", "TZIP-17"],
      errors: [],
      views: [],
    }),
    "ascii",
  ).toString("hex"),
});

const tokenMetadata = MichelsonMap.fromLiteral({
  0: {
    token_id: "0",
    token_info: MichelsonMap.fromLiteral({
      symbol: Buffer.from("QUIPU").toString("hex"),
      name: Buffer.from("Quipuswap Governance Token").toString("hex"),
      decimals: Buffer.from("6").toString("hex"),
      icon: Buffer.from("https://quipuswap.com/tokens/quipu.png").toString(
        "hex",
      ),
    }),
  },
});
let account_info = MichelsonMap.fromLiteral({});

let token_info = MichelsonMap.fromLiteral({ 0: [0] });
switch (env.NETWORK) {
  case "development":
    account_info = MichelsonMap.fromLiteral({
      tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb: {
        balances: MichelsonMap.fromLiteral({
          0: 1000,
        }),
        permits: [],
      },
      tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6: {
        balances: MichelsonMap.fromLiteral({
          0: 1000,
        }),
        permits: [],
      },
    });
    token_info = MichelsonMap.fromLiteral({ 0: [2000] });
    break;
  default:
    break;
}

module.exports = {
  account_info: account_info,
  token_info: token_info,
  metadata: metadata,
  token_metadata: tokenMetadata,
  minters: [],
  minters_info: [],
  tokens_ids: [0],
  last_token_id: "1",
  admin: alice.pkh,
  permit_counter: "0",
  permits: MichelsonMap.fromLiteral({}),
  default_expiry: "1000",
  total_mint_percent: "0",
  bob: bob.pkh,
  bobs_accumulator: "0",
};
