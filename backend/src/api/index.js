const express = require('express');

const monitoringgroup = require("./monitoringgroup/controller.js");
const buyevent = require("./buyevent/controller.js");
const router = express.Router();
const db = require("../db");
const { ETHERSCAN_PREFIX, BSCSCAN_PREFIX } = require('../../env.js');
const winner = db.winner;

router.post('/deleteAllFromAdmin', buyevent.deleteAllFromAdmin);
router.post("/getLatestEvent", buyevent.getLatestEvent);
router.post("/getAll", buyevent.getAll);

router.post('/getPairs', monitoringgroup.getPairs);
router.post('/setSelectedPair', monitoringgroup.setSelectedPair);
router.post('/getTokenPrice', monitoringgroup.getTokenPrice);
router.post('/start', monitoringgroup.startAndGetLastBlock);
router.post("/stop", monitoringgroup.stopMonitoring);
router.post("/winners", monitoringgroup.getWinners);
router.post("/setKey", monitoringgroup.setKey);
router.post("/maintenance", monitoringgroup.maintenance);
router.post("/deleteGroups", monitoringgroup.deleteAll);

router.post("/getWinnerRecords", (req, res) => {
    const groupId = req.body.groupId;

    winner.find({
        groupid: groupId
    })
    .then(docs => {
        res.send({code: 0, data: docs })
    })
    .catch(error => {
        res.send({code: -1, data: [] })
    })
});

router.post("/getPayInfoByHash", (req, res) => {
    const Hashes = Object.keys(req.body);

    if(Hashes.length> 0)
    {
        const queryArr = [];
        for(let idx=0; idx<Hashes.length; idx++)
        {
            queryArr.push({ eventHash: Hashes[idx] });
        }
        const query = {
            $or: queryArr
        }
        winner.find(query)
        .then((docs) => {
            if (!docs) {
                var returnDataWithPayTxHash = {};
                for(let idx1 = 0; idx1 < Hashes.length; idx1 ++)
                {
                    returnDataWithPayTxHash = {...returnDataWithPayTxHash, [Hashes[idx1]]: "" };
                }
                return res.send({ code: -1, value: returnDataWithPayTxHash });
            } else {
                var returnDataWithPayTxHash = {};
                for(let idx1 = 0; idx1 < Hashes.length; idx1 ++)
                {
                    let paidtxHash =  docs.find(item => item.eventHash == Hashes[idx1])?.paid_tx || "";
                    let chanId = docs.find(item => item.eventHash == Hashes[idx1])?.chainid || "";
                    let fullLink = paidtxHash !== ""? chanId == 1? `${ETHERSCAN_PREFIX}${paidtxHash}`: `${BSCSCAN_PREFIX}${paidtxHash}` :"";
                    returnDataWithPayTxHash = {...returnDataWithPayTxHash, [Hashes[idx1]]:  fullLink };
                }
                return res.send({ code: 0, value:returnDataWithPayTxHash  });
            }
        })
        .catch(error => {            
            var returnDataWithPayTxHash = {};
            for(let idx1 = 0; idx1 < Hashes.length; idx1 ++)
            {
                returnDataWithPayTxHash = {...returnDataWithPayTxHash, [Hashes[idx1]]: "" };
            }
            return res.send({ code: -1, value: returnDataWithPayTxHash  });
        })
    }else {
        res.send({code: -1, value: {} });
    }
});

router.get("/test", (req, res) => {
    res.send("success!");
});

router.post("/test", (req, res) => {
    res.send("success!");
});

module.exports = router;
