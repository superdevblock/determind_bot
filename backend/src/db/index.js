const dbConfig = require('./config');
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.mornitoringgroup = require("./monitoringGroup.model")(mongoose);
db.buyevent = require("./buyevent.model")(mongoose);
db.winner = require("./winner.model")(mongoose);
module.exports = db;
