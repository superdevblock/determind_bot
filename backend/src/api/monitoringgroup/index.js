const express = require('express');
const router = express.Router();
const monitoringgroup = require("./controller");

router.post('/getPairs', monitoringgroup.getPairs);
router.post('/setSelectedPair', monitoringgroup.setSelectedPair);
router.post('/getTokenPrice', monitoringgroup.getTokenPrice);
router.post('/start', monitoringgroup.startAndGetLastBlock);
router.post("/stop", monitoringgroup.stopMonitoring);
router.post("/winners", monitoringgroup.getWinners);
router.post("/disq", monitoringgroup.addDisq);
router.post("/setKey", monitoringgroup.setKey);
router.post("/maintenance", monitoringgroup.maintenance);
router.post("/deleteAll", monitoringgroup.deleteAll);

module.exports = router;
