require("dotenv").config();
const { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } = process.env;

const Logger = require("../util/Logger");
const path = require("path");
const readdir = require("util").promisify(require("fs").readdir);
const Sequelize = require("sequelize");

const db = new Sequelize(`postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
  logging: false,
});

class Database {
  static get db() {
    return db;
  }

  static async authenticate() {
    try {
      await db.authenticate();
      Logger.info("Database connection has been established successfully.", { tag: "POSTGRESQL" });
      await this.loadModels(path.join(__dirname, "..", "models"));
    } catch (err) {
      Logger.error("Unable to connect to the database.", { tag: "POSTGRESQL" });
      Logger.info("Attempting to connect again in 5 seconds.", { tag: "POSTGRESQL" });
      setTimeout(this.authenticate.bind(this), 5000);
    }
  }

  static async loadModels(modelsPath) {
    const files = await readdir(modelsPath);
    for (const file of files) {
      const filePath = path.join(modelsPath, file);
      if (!filePath.endsWith(".js")) continue;
      await require(filePath).sync({ alter: true }); // eslint-disable-line no-await-in-loop
    }
  }
}

module.exports = Database;
