const express = require('express');
const router = express.Router();
const buyevent = require("./controller");

router.post('/deleteAllFromAdmin', buyevent.deleteAllFromAdmin);
router.post("/getLatestEvent", buyevent.getLatestEvent);
router.post("/getAll", buyevent.getAll);

module.exports = router;
