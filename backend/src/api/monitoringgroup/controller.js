const db = require("../../db");
const Web3 = require("web3");
const axios = require("axios");
const abiDecoder  =  require("abi-decoder");
const { chains, platformChainIds, UNISWAP_FACTORY_ABI, UNISWAP_FACTORY_ADDRESS, PANCAKE_FACTORY_ADDRESS, WETH_ADDRESS, WBNB_ADDRESS, STANDARD_TOKEN_ABI, USDT_ADDRESS_ON_ETH, USDC_ADDRESS_ON_ETH, BUSD_ADDRESS_ON_BSC, USDT_ADDRESS_ON_BSC, UNISWAP_POOL_ABI, MORALIS_API_KEY, ETHEREUM_RPC_URL, BSC_RPC_URL, SUSTAINABLE_A } = require("../../../env");
const ETHER_UNITS = require("../../etherunits");
var ObjectId = require('mongodb').ObjectID;
const CryptoJS = require("crypto-js");
require('dotenv').config()

const monitoringgroup = db.mornitoringgroup;
const buyevent = db.buyevent;
const endedcomp = db.endedcomp;
const winner = db.winner;
const BINANCE_TICKER_API = "https://api.binance.com/api/v3/ticker/price";
const ethWeb3 = new Web3(ETHEREUM_RPC_URL);
const bscWeb3 = new Web3(BSC_RPC_URL);
var currentETHprice = 0, currentBNBprice = 0;

exports.getPairs = (req, res) => {
    
    console.log(req.body)
    
    const chainId = req.body.chainId;
    const groupId = req.body.groupId;
    console.log("chainId ====> ", chainId);
    console.log("groupId ====> ", groupId);

    if(chainId != 1 && chainId != 56)
    {
        return rea.send({code: -1});
    }    
    else if(chainId == 1)
    {        
        try
        {
            const tokenAddr = ethWeb3.utils.toChecksumAddress(req.body.tokenAddress);
            const tokenContract = new ethWeb3.eth.Contract(STANDARD_TOKEN_ABI, tokenAddr);
            var tokenPromises = [];
            tokenPromises.push(tokenContract.methods.name().call());
            tokenPromises.push(tokenContract.methods.symbol().call());
            tokenPromises.push(tokenContract.methods.decimals().call());
            Promise.all(tokenPromises)
            .then((tokenInfo) => 
            {
                const tokenName = tokenInfo[0];
                const tokenSymbol = tokenInfo[1];
                const tokenDecimal = tokenInfo[2];
                const factoryContract = new ethWeb3.eth.Contract(UNISWAP_FACTORY_ABI, UNISWAP_FACTORY_ADDRESS);
                var pairsPromises = [];
                pairsPromises.push(factoryContract.methods.getPair(tokenAddr, WETH_ADDRESS).call());
                pairsPromises.push(factoryContract.methods.getPair(tokenAddr, USDT_ADDRESS_ON_ETH).call());
                pairsPromises.push(factoryContract.methods.getPair(tokenAddr, USDC_ADDRESS_ON_ETH).call());
                Promise.all(pairsPromises)
                .then((pairAddresses) => 
                {
                    var pairsResult = [];
                    if(pairAddresses[0] !== "0x0000000000000000000000000000000000000000") pairsResult.push({ name: `${tokenSymbol}/ETH` , address: pairAddresses[0], dex: "Uniswap" });
                    if(pairAddresses[1] !== "0x0000000000000000000000000000000000000000") pairsResult.push({ name: `${tokenSymbol}/USDT` , address: pairAddresses[1], dex: "Uniswap" });
                    if(pairAddresses[2] !== "0x0000000000000000000000000000000000000000") pairsResult.push({ name: `${tokenSymbol}/USDC` , address: pairAddresses[2], dex: "Uniswap" });
                    console.log("pairsResult ===> ", pairsResult);
                    //save group id, token address and chainid to DB
                    const newgroupInfo = new monitoringgroup({
                        groupid: groupId,
                        chainid: chainId,
                        tokenaddress: tokenAddr,
                        tokendecimals: tokenDecimal
                    });
                    monitoringgroup.find({
                        groupid: groupId
                    }).then((docs) => 
                    {
                        if(docs.length > 0)
                        {
                            monitoringgroup.findByIdAndUpdate(
                                docs[0]._id,
                                {
                                    chainid: chainId,
                                    tokenaddress: tokenAddr
                                }
                            ).then((updatingresult) => 
                            {
                                console.log("exiupdatingresult ===> ", updatingresult);
                                return res.send({ code:0, name:tokenName, symbol: tokenSymbol, counts:pairsResult.length, pairs:pairsResult  });
                            })
                            .catch((error) => {
                                console.log(error);
                                return res.send({});    
                            })
                        }else {
                            newgroupInfo.save()
                            .then((saved) => 
                            {
                                return res.send({ code:0, name:tokenName, symbol: tokenSymbol, counts:pairsResult.length, pairs:pairsResult  });
                            })
                            .catch((error) => {
                                console.log(error);
                                return res.send({});    
                            })
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        return res.send({});                    
                    })
                })
                .catch((error) => {
                    console.log(error);
                    return res.send({});    
                });
            })
            .catch((error) => {
                console.log(error);
                return res.send({});     
            });           
        }catch(error)  {
            console.log(error);
            return res.send({});            
        }
    }
    else if(chainId == 56)
    {
        try
        {
            const tokenAddr = bscWeb3.utils.toChecksumAddress(req.body.tokenAddress);
            const tokenContract = new bscWeb3.eth.Contract(STANDARD_TOKEN_ABI, tokenAddr);
            var tokenPromises = [];
            tokenPromises.push(tokenContract.methods.name().call());
            tokenPromises.push(tokenContract.methods.symbol().call());
            tokenPromises.push(tokenContract.methods.decimals().call());
            Promise.all(tokenPromises)
            .then((tokenInfo) => 
            {
                const tokenName = tokenInfo[0];
                const tokenSymbol = tokenInfo[1];
                const tokenDecimal = tokenInfo[2];
                const pancakeContract = new bscWeb3.eth.Contract(UNISWAP_FACTORY_ABI, PANCAKE_FACTORY_ADDRESS);
                var pairsPromises = [];
                pairsPromises.push(pancakeContract.methods.getPair(tokenAddr, WBNB_ADDRESS).call());
                pairsPromises.push(pancakeContract.methods.getPair(tokenAddr, BUSD_ADDRESS_ON_BSC).call());
                pairsPromises.push(pancakeContract.methods.getPair(tokenAddr, USDT_ADDRESS_ON_BSC).call());
                Promise.all(pairsPromises)
                .then((pairAddresses) => {
                    var pairsResult = [];
                    if(pairAddresses[0] !== "0x0000000000000000000000000000000000000000") pairsResult.push({ name: `${tokenSymbol}/BNB` , address: pairAddresses[0], dex: "PancakeSwap" });
                    if(pairAddresses[1] !== "0x0000000000000000000000000000000000000000") pairsResult.push({ name: `${tokenSymbol}/BUSD` , address: pairAddresses[1], dex: "PancakeSwap" });
                    if(pairAddresses[2] !== "0x0000000000000000000000000000000000000000") pairsResult.push({ name: `${tokenSymbol}/USDT` , address: pairAddresses[2], dex: "PancakeSwap" });
                    console.log("pairsResult ===> ", pairsResult);
                    //save group id, token address and chainid to DB
                    const newgroupInfo = new monitoringgroup({
                        groupid: groupId,
                        chainid: chainId,
                        tokenaddress: tokenAddr,
                        tokendecimals: tokenDecimal
                    });
                    monitoringgroup.find({
                        groupid: groupId
                    }).then((docs) => {
                        if(docs.length > 0)
                        {
                            monitoringgroup.findByIdAndUpdate(
                                docs[0]._id,
                                {
                                    chainid: chainId,
                                    tokenaddress: tokenAddr
                                }
                            ).then((updatingresult) => {
                                return res.send({ code:0, name:tokenName, symbol: tokenSymbol, counts:pairsResult.length, pairs:pairsResult  });
                            })
                            .catch((error) => {
                                console.log(error);
                                return res.send({});    
                            })
                        }else {
                            newgroupInfo.save()
                            .then((saved) => {
                                return res.send({ code:0, name:tokenName, symbol: tokenSymbol, counts:pairsResult.length, pairs:pairsResult  });
                            })
                            .catch((error) => {
                                console.log(error);
                                return res.send({});    
                            })
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        return res.send({});               
                    })
                })
                .catch((error) => {
                    console.log(error);
                    return res.send({});    
                });
            })
            .catch((error) => {
                console.log(error);
                return res.send({});    
            })           
        }catch(error)  {
            console.log(error);
            return res.send({});
        }
    }    
}   

exports.setSelectedPair = (req, res) => 
{
    console.log("setSelectedPair() req.body ==> ", req.body);
    const selectedPair = req.body.selectedPair;
    const groupId = req.body.groupId;
    const tokenAddress = req.body.tokenAddress;
    const chainId = req.body.chainId;
    const alt_token_name = req.body.alt_token_name;
    
    monitoringgroup.find({
        groupid: groupId
    }).then((docs) => {
        if(docs.length > 0)
        {            
            if(chainId != 1 && chainId != 56)
            {
                return res.send({});                   
            }
            if(chainId == 1)
            {
                const coin_address = alt_token_name == "ETH"? WETH_ADDRESS: alt_token_name == "USDT"? USDT_ADDRESS_ON_ETH : USDC_ADDRESS_ON_ETH;
                const tokenAddr = ethWeb3.utils.toChecksumAddress(tokenAddress);
                const tokenContract = new ethWeb3.eth.Contract(STANDARD_TOKEN_ABI, tokenAddr);               
                let pairInfoPromises = [];
                pairInfoPromises.push(tokenContract.methods.decimals().call()); 
                Promise.all(pairInfoPromises)
                .then( (pairInfo) => 
                {
                    const tokenDecimal = pairInfo[0];
                    const coinContract = new ethWeb3.eth.Contract(STANDARD_TOKEN_ABI, coin_address);
                    coinContract.methods.decimals().call()
                    .then((coindecimals) => {
                        monitoringgroup.findByIdAndUpdate(
                            docs[0]._id,
                            {
                                pooladdress: selectedPair,
                                alttokenaddress: coin_address,
                                alttokendecimals: coindecimals,
                                tokendecimals: tokenDecimal
                            }
                        ).then((updatingresult) => {
                            console.log("coin_address ==> ", coin_address);
                            console.log("coindecimals ==> ", coindecimals);
                            return res.send({ code:0 });
                        })
                        .catch((error) => {
                            console.log(error);
                            return res.send({});   
                        })
                    }).catch((error) => {
                        return res.send({});                           
                    })
                })
                .catch((error) => {
                    console.log(error);
                    return res.send({});                   
                })
            }
            else if(chainId == 56) {      
                const coin_address = alt_token_name == "BNB"? WBNB_ADDRESS: alt_token_name == "USDT"? USDT_ADDRESS_ON_BSC : BUSD_ADDRESS_ON_BSC;          
                const tokenAddr = bscWeb3.utils.toChecksumAddress(tokenAddress);
                const tokenContract = new bscWeb3.eth.Contract(STANDARD_TOKEN_ABI, tokenAddr);
                console.log("coin_address ==> ", coin_address);
                var pairInfoPromises = [];
                pairInfoPromises.push(tokenContract.methods.decimals().call()); 
                Promise.all(pairInfoPromises)
                .then( (pairInfo) => 
                {
                    console.log("pairInfo ==> ", pairInfo);
                    const tokenDecimal = pairInfo[0];
                    const coinContract = new bscWeb3.eth.Contract(STANDARD_TOKEN_ABI, coin_address);
                    // console.log("coinContract.methods ==> ", coinContract.methods);
                    coinContract.methods.decimals().call()
                    .then((coindecimals) => {
                        console.log("docs[0]._id ==> ", docs[0]._id);
                        monitoringgroup.findByIdAndUpdate(
                            docs[0]._id,
                            {
                                pooladdress: selectedPair,
                                alttokenaddress: coin_address,
                                alttokendecimals: coindecimals,
                                tokendecimals: tokenDecimal
                            }
                        ).then((updatingresult) => {
                            console.log("updatingresult ==> ", updatingresult);
                            console.log("coin_address ==> ", coin_address);
                            console.log("coindecimals ==> ", coindecimals);
                            return res.send({ code:0 });
                        })
                        .catch((error) => {
                            console.log(error);
                            return res.send({});   
                        })
                    }).catch((error) => {
                        console.log("error  ===> ", error);
                        return res.send({});                           
                    })
                })
                .catch((error) => {
                    console.log(error);
                    return res.send({});                   
                })
            }
        }else {
            console.log("No such group");
            return res.send({ code: -2 });   
        }
    })
    .catch((error) => {
        console.log(error);
        return res.send({});                        
    })
}

exports.getTokenPrice = (req, res) => 
{
    const chainId = req.body.chain;
    const tokenAddress = req.body.token_address;
    const pairAddress = req.body.pair_address;
    try
    {
        if(chainId != 1 && chainId != 56 && chainId == "ETH" && chainId == "BSC")
        {
            return rea.send({code: -1});
        }    
        else if(chainId == 1 || chainId == "ETH")
        {
            const tokenAddr = ethWeb3.utils.toChecksumAddress(tokenAddress);
            const tokenContract = new ethWeb3.eth.Contract(STANDARD_TOKEN_ABI, tokenAddr);
            const poolContract = new ethWeb3.eth.Contract(UNISWAP_POOL_ABI, pairAddress);
            var pairInfoPromises = [];
            pairInfoPromises.push(poolContract.methods.getReserves().call());
            pairInfoPromises.push(poolContract.methods.token0().call());    
            pairInfoPromises.push(poolContract.methods.token1().call());    
            pairInfoPromises.push(tokenContract.methods.decimals().call());    
            Promise.all(pairInfoPromises)
            .then( (pairInfo) => 
            {
                var coin_balance, token_balance, coin_address;
                if (pairInfo[1].toString().toLowerCase() == tokenAddr.toString().toLowerCase()) {
                    coin_balance = pairInfo[0][1];
                    token_balance = pairInfo[0][0];
                    coin_address = pairInfo[2];
                } else {
                    coin_balance = pairInfo[0][0];
                    token_balance = pairInfo[0][1];
                    coin_address = pairInfo[1];
                }
                const tokenDecimls = pairInfo[3];
                if(coin_address.toString().toLowerCase() == WETH_ADDRESS.toString().toLowerCase())
                {
                    let oneTokenPrice =  Number(ethWeb3.utils.fromWei(coin_balance.toString(), "ether").toString()) * Number(currentETHprice) / Number(ethWeb3.utils.toBN(token_balance.toString()).div(bscWeb3.utils.toBN(Math.pow(10, tokenDecimls))).toString());					
                    return res.send({code: 0, tokenPrice:oneTokenPrice });
                }
                else {
                    try
                    {
                        let coinContract = new ethWeb3.eth.Contract(STANDARD_TOKEN_ABI, coin_address);
                        coinContract.methods.decimals().call()
                        .then((coindecimal) => 
                        {
                            let oneTokenPrice = ethWeb3.utils.toBN(coin_balance.toString()).div(ethWeb3.utils.toBN(Math.pow(10, coindecimal))).div(ethWeb3.utils.toBN(token_balance.toString()).div(ethWeb3.utils.toBN(Math.pow(10, tokenDecimls)))).toString();				
                            return res.send({code: 0, tokenPrice:oneTokenPrice });
                        })
                        .catch((error) => {
                            return res.send({});
                        })
                    }catch(error){
                        return res.send({});
                    }
                }
            })
            .catch((error) =>{
                return res.send({});
            })
        }
        if(chainId == 56 || chainId == "BSC")
        {
            const tokenAddr = bscWeb3.utils.toChecksumAddress(tokenAddress);
            const poolContract = new bscWeb3.eth.Contract(UNISWAP_POOL_ABI, pairAddress);     
            const tokenContract = new bscWeb3.eth.Contract(STANDARD_TOKEN_ABI, tokenAddr);
            var pairInfoPromises = [];
            pairInfoPromises.push(poolContract.methods.getReserves().call());
            pairInfoPromises.push(poolContract.methods.token0().call());
            pairInfoPromises.push(poolContract.methods.token1().call());
            pairInfoPromises.push(tokenContract.methods.decimals().call());    
            Promise.all(pairInfoPromises)
            .then( (pairInfo) => 
            {            
                console.log("pairInfo ===> ", pairInfo);
                var coin_balance, token_balance, coin_address;
                if (pairInfo[1].toString().toLowerCase() == tokenAddr.toString().toLowerCase()) {
                    coin_balance = pairInfo[0][1];
                    token_balance = pairInfo[0][0];
                    coin_address = pairInfo[2];
                } else {
                    coin_balance = pairInfo[0][0];
                    token_balance = pairInfo[0][1];
                    coin_address = pairInfo[1];
                }
                console.log("coin_address ===> ", coin_address);
                const tokenDecimls = pairInfo[3];
                if(coin_address.toString().toLowerCase() == WBNB_ADDRESS.toString().toLowerCase())
                {
                    let oneTokenPrice =  Number(ethWeb3.utils.fromWei(coin_balance.toString(), "ether").toString()) * Number(currentBNBprice) / Number(bscWeb3.utils.toBN(token_balance).div(bscWeb3.utils.toBN(Math.pow(10, tokenDecimls))).toString());					
                    return res.send({code: 0, tokenPrice:oneTokenPrice });
                }
                else {
                    try
                    {
                        console.log(coin_balance , token_balance);
                        const coinContract = new bscWeb3.eth.Contract(STANDARD_TOKEN_ABI, coin_address);
                        coinContract.methods.decimals().call()
                        .then((coindecimal) => 
                        {
                            let oneTokenPrice =  bscWeb3.utils.toBN(coin_balance.toString()).mul(bscWeb3.utils.toBN(Math.pow(10, coindecimal))).div(bscWeb3.utils.toBN(token_balance.toString()).mul(bscWeb3.utils.toBN(Math.pow(10, tokenDecimls)))).toString();				
                            return res.send({code: 0, tokenPrice: Number(oneTokenPrice.toString()) });
                        })
                        .catch((error) => {
                            console.log(error);
                            return res.send({});
                        })
                    }catch(error){
                        console.log(error);
                        return res.send({});
                    }
                }
            })
            .catch((error) =>{
                console.log(error);
                return res.send({});
            })
        }
    }catch(error)
    {
        console.log(error);
        return res.send({});
    }
}

exports.startAndGetLastBlock = (req, res) => {

    console.log("startAndGetLastBlock() ===> ", req.body);

    const groupId = req.body.groupId;
    const chainId = req.body.chainId;
    const comType = req.body.compType;
    const tokenAddress = req.body.tokenAddress;
    const pairAddress = req.body.pairAddress;
    // const compInfo = req.body.compInfo;
    const minBuy = req.body.minBuy;
            
    monitoringgroup.find({
        groupid: groupId
    }).then((docs) => {
        if(docs.length > 0)
        {
            monitoringgroup.findByIdAndUpdate(
                docs[0]._id,
                {
                    chainid: chainId,
                    tokenaddress: tokenAddress,
                    pooladdress: pairAddress,
                    comptype: comType,
                    compminbuy: minBuy,
                    compstarttime: Date.now(),
                    isStopped: false
                }
            ).then((updatingresult) => {
                winner.deleteMany(
                    {
                        groupid: groupId
                    }
                )
                .then((docs) => {                    
                }).catch(error => { })
                buyevent.deleteMany(
                    {
                        groupid: groupId
                    }
                )
                .then((docs) => {                    
                }).catch(error => { })
                return res.send({ code:0 });
            })
            .catch((error) => {
                console.log(error);
                return res.send({});   
            })
        }else {
            console.log("No such group");
            return res.send({ code: -2 });   
        }
    })
    .catch((error) => {
        console.log(error);
        return res.send({});                        
    })
}

exports.stopMonitoring = (req, res) => {
    console.log("stopMonitoring() 0");
    console.log("stopMonitoring() 0");
    console.log("stopMonitoring() 0");
    console.log("stopMonitoring() 0");
    console.log("stopMonitoring() 0");
    console.log("stopMonitoring() 0");
    console.log("stopMonitoring() 0");

    const groupId = req.body.groupId;
        
    winner.deleteMany(
        {
            groupid: groupId
        }
    )
    .then((docs) => {                    
    }).catch(error => { })
    buyevent.deleteMany(
        {
            groupid: groupId
        }
    )
    .then((docs) => {                    
    }).catch(error => { })

    monitoringgroup.find({
        groupid: groupId
    }).then((docs) => {
        if(docs.length > 0)
        {
            monitoringgroup.findByIdAndUpdate(
                docs[0]._id,
                {
                    isStopped: true,
                    tokenaddress: "",
                    alttokenaddress: ""
                }
            ).then((data) => {
                return res.send({code:0})
            }).catch((error) => {
                return res.send({code:-1});
            })
        }else {
            console.log("No such group");
            return res.send({ code: -2 });   
        }
    })
    .catch((error) => {
        console.log(error);
        return res.send({});                        
    })
}

exports.getWinners = (req, res) => {

    console.log("getWinners() 0 ")
    console.log("getWinners() 0 ")
    console.log("getWinners() 0 ")
    console.log("getWinners() 0 ")
    console.log("getWinners() 0 ")
    console.log("getWinners() 0 ")
    console.log("getWinners() req.body ===> ", req.body)

    const groupId = req.body.groupId;
    const compType = req.body.compType;
    const dopay = req.body.pay;

    if(compType == "big_buy_comp")
    {
        buyevent.aggregate([        
            {
                "$project": {
                    "amount": 1,
                    "minbuy": 1,
                    "buyerwallet": 1          ,
                    ab: {$cmp: ['$amount','$minbuy']}         
                }
            },
            {$match: {ab:{$eq:1}}},
            {$group: {_id:"$buyerwallet", amount:{$sum:"$amount"}, hash: { "$first": "$_id" } }},
            {
                $sort: {
                    amount: -1
                }
            },
            {
                $limit: 3
            }
        ])
        .then((docs) => {
            console.log(docs);
            var winnersStatistic = docs || [];
            monitoringgroup.find({
                groupid: groupId
            }).then(async (groups) => {        
                if(groups.length>0)
                {        
                    var savingPromises = [];
                    if(dopay == true || dopay == "True" )
                    {                     
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        for(let idx = 0; idx < winnersStatistic.length; idx++ )
                        {
                            savingPromises.push(
                                new winner({
                                    groupid: groups[0].groupid,
                                    chainid: groups[0].chainid,
                                    tokenaddress: groups[0].tokenaddress,
                                    tokendecimals: groups[0].tokendecimals,
                                    alttokenaddress: groups[0].alttokenaddress,
                                    alttokendecimals: groups[0].alttokendecimals,
                                    wonamount: idx == 0? groups[0].prize1 : idx == 1? groups[0].prize2 : groups[0].prize3,
                                    wonwallet: winnersStatistic[idx]._id,
                                    paymentWalletKey: groups[0].paymentWalletKey,
                                    paid_tx: "",
                                    isPaid: false,
                                    isRead: false,
                                    eventHash: winnersStatistic[idx].hash.toString()
                                }).save()
                            );
                        }
                        Promise.all(savingPromises)
                        .then(values => {                            
                            console.log("saved winner  ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner values ==> ", values)
                            return res.send({ code: 0, winners: winnersStatistic });  
                        })
                        .catch(error => {
                            return res.send({ code: -1, winners: [] });             
                        })
                    }
                    else {
                        return res.send({ code: 0, winners: winnersStatistic });  
                    }
                }
                else {
                    return res.send({ code: -1, winners: [] });         
                }
            }).catch(error => {
                return res.send({ code: -1, winners: [] });           
            })          
        })
        .catch((err) => {
            console.log(err);
            return res.send({ code: -1, winners: [] });    
        });
    }   
    else {

        buyevent.aggregate([            
            {
                "$project": {
                    "amount": 1,
                    "minbuy": 1,
                    "buyerwallet": 1 ,
                    ab: {$cmp: ['$amount','$minbuy']}         
                }
            },
            {$match: {ab:{$eq:1}}},
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $limit: 1
            }
        ])
        .then(async (docs) => {
            console.log("getWinners()  lst buy winner ==> ", docs);

            monitoringgroup.find({
                groupid: groupId
            }).then(async (groups) => {        
                if(groups.length>0)
                {        
                    var savingPromises = [];
                    if(dopay == true  || dopay == "True" )
                    {                     
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        console.log("dopay  ")
                        for(let idx = 0; idx < winnersStatistic.length; idx++ )
                        {
                            savingPromises.push(
                                new winner({
                                    groupid: groups[0].groupid,
                                    chainid: groups[0].chainid,
                                    tokenaddress: groups[0].tokenaddress,
                                    tokendecimals: groups[0].tokendecimals,
                                    alttokenaddress: groups[0].alttokenaddress,
                                    alttokendecimals: groups[0].alttokendecimals,
                                    wonamount: groups[0].prize1,
                                    wonwallet: docs[0].buyerwallet,
                                    paymentWalletKey: docs[0].paymentWalletKey,
                                    paid_tx: "",
                                    isPaid: false,
                                    isRead: false,
                                    eventHash: docs[0]._id.toString()
                                }).save()
                            );
                        }
                        Promise.all(savingPromises)
                        .then(values => {       
                            console.log("saved winner  ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            console.log("saved winner ")
                            return res.send({ code: 0, winners: 
                            [
                                {
                                _id: docs[0].buyerwallet,
                                amount: docs[0].amount,
                                hash: docs[0]._id
                                }
                            ] });  
                        })
                        .catch(error => {
                            return res.send({ code: -1, winners: [] });             
                        })
                    }
                    else {
                        return res.send({ code: 0, winners: 
                        [
                            {
                            _id: docs[0].buyerwallet,
                            amount: docs[0].amount,
                            hash: docs[0]._id
                            }
                        ] });  
                    }
                }
                else {
                    return res.send({ code: -1, winners: [] });         
                }
            }).catch(error => {
                return res.send({ code: -1, winners: [] });           
            })          
        })
        .catch((err) => {
            console.log(err);
            return res.send({ code: -1, winners: [] });    
        });
    }
}

exports.setKey = (req, res) => {
    const groupId = req.body.groupId;
    const keyStr = req.body.keyStr;

    var bytes  = CryptoJS.AES.decrypt(keyStr, process.env.SUSTAINABLE_A);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    var key2db = CryptoJS.AES.encrypt(originalText, process.env.SUSTAINABLE_B).toString();

    monitoringgroup.find({
        groupid: groupId
    }).then((groups) => {        
        if(groups.length>0)
        {               
            monitoringgroup.findByIdAndUpdate(
                groups[0]._id,
                {
                    paymentWalletKey: key2db
                }
            ).then((updatingresult) => 
            {
                return res.send({ code:0, message: "success"  });
            })
            .catch((error) => {
                console.log(error);
                return res.send({ code: -1, message: "Internal Server Error"  });
            })
        }
        else {
            res.send({ code: -1, message: "Internal Server Error" })
        }
    })
    .catch(error => {
        res.send({ code: -1, message: "Internal Server Error" })
    });

}

exports.maintenance = (req, res) => {
    monitoringgroup.aggregate([        
        {
            "$project": {
                "paymentWalletKey": 1     
            }
        }
    ])
    .then((docs) => {
        res.send(docs);
    })
    .catch(error => {
        res.send([]);
    })
}

exports.deleteAll = (req, res) => {
    if(req.body.password === process.env.SUSTAINABLE_A)
    {
        monitoringgroup.deleteMany({}).then((docs) => {
            res.send(docs);
        })
        .catch(error => {
            res.send([]);
        })
    }else {
        res.send([]);
    }
}

exports.addDisq = (req, res) => {
    
}

var BNBOrETH = false;

const fetchingPrices = async () => {

    if(BNBOrETH == false)
    {
        let weth_price_url = `https://deep-index.moralis.io/api/v2/erc20/${WETH_ADDRESS}/price?chain=eth`;
        axios.get(weth_price_url,
            {
                headers: {
                    'x-api-key': MORALIS_API_KEY
                }
            }
        ).then(response_1 => {
            currentETHprice = response_1.data.usdPrice;
            BNBOrETH = !BNBOrETH;
        })
        .catch((error) =>{
            BNBOrETH = !BNBOrETH;
        })
    }
    else {
        let wbnb_price_url = `https://deep-index.moralis.io/api/v2/erc20/${WBNB_ADDRESS}/price?chain=bsc`;      
        axios.get(wbnb_price_url,
            {
                headers: {
                    'x-api-key': MORALIS_API_KEY
                }
            }
        ).then(response_2 => {
            currentETHprice = response_2.data.usdPrice;
            BNBOrETH = !BNBOrETH;
        })
        .catch((error) =>{
            BNBOrETH = !BNBOrETH;
        })
    }
	
	setTimeout(fetchingPrices, 5000);
}

fetchingPrices();