require("dotenv").config();
//require("dotenv").config({ path: "./dev.env" });

const SakuraClient = require("./client/SakuraClient");
const Logger = require("./util/Logger");

const Raven = require("raven");
const { name, version } = require("../package.json");

Raven.config(process.env.RAVEN, {
  captureUnhandledRejections: true,
  autoBreadcrumbs: true,
  environment: name,
  release: version,
}).install();

Raven.context(() => {
  const client = new SakuraClient({
    owner: process.env.BOT_OWNERS,
    token: process.env.BOT_TOKEN,
  });
  client
    .on("error", (err) => Logger.error(err, { tag: "CLIENT ERROR" }, err.stack))
    .on("shardError", (err, id) => Logger.error(`[SHARD ${id} ERROR] ${err.message}`, { tag: "SHARD ERROR" }, err.stack))
    .on("warn", (warn) => Logger.warn(warn, { tag: "CLIENT WARN" }));
  client.start();
});

process.on("unhandledRejection", (err) => {
  Logger.error(`[UNHANDLED REJECTION] ${err.message}`);
  Raven.captureException(err);
});
