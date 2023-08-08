//require("dotenv").config();
require("dotenv").config({ path: "./dev.env" });

const SakuraClient = require("./client/SakuraClient");
const Logger = require("./util/Logger");

const { name, version } = require("../package.json");
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY,
  tracesSempleRate: 1.0,
  release: version,
  environment: name,
});

const client = new SakuraClient({
  owner: process.env.BOT_OWNERS,
  token: process.env.BOT_TOKEN,
});
client
  .on("error", (err) => Logger.error(err, { tag: "CLIENT ERROR" }, err.stack))
  .on("shardError", (err, id) => Logger.error(`[SHARD ${id} ERROR] ${err.message}`, { tag: "SHARD ERROR" }, err.stack))
  .on("warn", (warn) => Logger.warn(warn, { tag: "CLIENT WARN" }));
client.start();

process.on("unhandledRejection", (err) => {
  Logger.error(`[UNHANDLED REJECTION] ${err.message}`);
  Sentry.captureException(err);
});
