const { WETH_ADDRESS, WBNB_ADDRESS, STANDARD_TOKEN_ABI, platformChainIds, UNISWAP_POOL_ABI, MORALIS_API_KEY } = require("../../../env");
const db = require("../../db");
const axios = require("axios");
const Web3 = require("web3");
const ETHER_UNITS = require("../../etherunits");
const buyevent = db.buyevent;
const monitoringgroup = db.mornitoringgroup;
var currentETHprice = 0, currentBNBprice = 0;

const mainnet_http_RPC = require("../../../env.js").ETHEREUM_RPC_URL;
const mainnet_http_RPC1 = require("../../../env.js").BSC_RPC_URL;
console.log("mainnet_http_RPC1 ===> ", mainnet_http_RPC1)
var web3WS = new Web3(mainnet_http_RPC);
var web3WS1 = new Web3(mainnet_http_RPC1);

exports.getLatestEvent = (req, res) => 
{
    const groupId = req.body.groupId;    
    buyevent.find(
        {
            groupid: groupId,
            isreaded: false
        }
    ).sort({ createdAt: -1 })
    .then((data) => {
        const popupdata = data[0];
        console.log(groupId, "  popupdata ===> ", popupdata);
        if(data.length > 0)
        {
            var token_amount = 0;
            const alt_token_amount = data[0].amount;
            var value = 0;
            const buyer_address = data[0].buyerwallet;
            const txn = data[0].txhash;

            const altTokenDecimals = data[0].alttokendecimals;
            const altTokenAddress = data[0].alttokenaddress;
            const tokenDecimls = data[0].tokendecimals;
            const tokenAddress = data[0].tokenaddress;        
            const coin_ethunitname = Object.keys(ETHER_UNITS).find(key => Math.pow(10, altTokenDecimals).toString() == ETHER_UNITS[key] );
            const token_ethunitname = Object.keys(ETHER_UNITS).find(key => Math.pow(10, tokenDecimls).toString() == ETHER_UNITS[key] );
            if(data[0].chainid == 1)
            {
                const poolContract = new web3WS.eth.Contract(UNISWAP_POOL_ABI, data[0].pooladdress);
                var pairInfoPromises = [];
                pairInfoPromises.push(poolContract.methods.getReserves().call());
                pairInfoPromises.push(poolContract.methods.token0().call());
                Promise.all(pairInfoPromises)
                .then( (pairInfo) => 
                {
                    var coin_balance, token_balance;
                    if (pairInfo[0].toString().toLowerCase() == tokenAddress.toString().toLowerCase()) {
                        coin_balance = pairInfo[0][1];
                        token_balance = pairInfo[0][0];
                    } else {
                        coin_balance = pairInfo[0][0];
                        token_balance = pairInfo[0][1];
                    }
                    let oneTokenPrice = 0; 
                    const tokenContract = new web3WS.eth.Contract(STANDARD_TOKEN_ABI, tokenAddress);
                    if(altTokenAddress.toString().toLowerCase() === WETH_ADDRESS.toString().toLowerCase())
                    {                    
                        oneTokenPrice = currentETHprice * Number(web3WS.utils.fromWei(token_balance.toString(), token_ethunitname).toString() ) / Number(web3WS.utils.fromWei(coin_balance.toString(), coin_ethunitname.toString()).toString())				                                                       
                        value = Number(alt_token_amount) * Number(currentETHprice);
                        token_amount = value  / oneTokenPrice ; 

                        tokenContract.methods.totalSupply().call()
                        .then((totalSupply) => {
                            // console.log("totalSupply ", totalSupply);

                            buyevent.findByIdAndUpdate(data[0]._id,
                                {
                                    isreaded: true
                                })
                            .then((data) => {
                                return res.send({ code: 0, event:popupdata  });
                            })
                            .catch((error => {
                                console.log("1111 ", error);
                                return res.send({ code: -1, event: null  });
                            }))

                            return res.send({ code: 0, event:{
                                token_amount: Number(token_amount).toFixed(4), 
                                alt_token_amount: Number(alt_token_amount).toFixed(4), 
                                value: Number(value).toFixed(4), 
                                buyer_address, 
                                txn, 
                                marketcap:  Number(Number(web3WS.utils.fromWei(totalSupply.toString(), token_ethunitname).toString() )  *  oneTokenPrice).toFixed(4)
                            
                                }  
                            });
                        })
                        .catch((error) => {
                            console.log("22222 ", error);
                            return res.send({ code: -1, event: null  });
                        })
                    }
                    else {
                        oneTokenPrice = Number(web3WS.utils.fromWei(token_balance.toString(), token_ethunitname).toString() ) / Number(web3WS.utils.fromWei(coin_balance.toString(), coin_ethunitname.toString()).toString())				                                                       
                        value = Number(alt_token_amount);
                        token_amount = value  / oneTokenPrice ; 

                        tokenContract.methods.totalSupply().call()
                        .then((totalSupply) => {              
                            // console.log("totalSupply ", totalSupply);

                            buyevent.findByIdAndUpdate(data[0]._id,
                                {
                                    isreaded: true
                                })
                            .then((data) => {
                            })
                            .catch((error => {
                            }))
                            
                            return res.send({ code: 0, event:{
                                token_amount: Number(token_amount).toFixed(4), 
                                alt_token_amount: Number(alt_token_amount).toFixed(4), 
                                value: Number(value).toFixed(4), 
                                buyer_address, 
                                txn, 
                                marketcap:  Number(Number(web3WS.utils.fromWei(totalSupply.toString(), token_ethunitname).toString() )  *  oneTokenPrice).toFixed(4)
                            
                                }  
                            });
                        })
                        .catch((error) => {
                            console.log("3333 ", error);
                            return res.send({ code: -1, event: null  });
                        })
                    }
                })
                .catch((error) =>{
                    return res.send({ code: -1, event: null  });
                })
            }
            else {            
                const poolContract = new web3WS1.eth.Contract(UNISWAP_POOL_ABI, data[0].pooladdress);
                var pairInfoPromises = [];
                pairInfoPromises.push(poolContract.methods.getReserves().call());
                pairInfoPromises.push(poolContract.methods.token0().call());
                Promise.all(pairInfoPromises)
                .then( (pairInfo) => 
                {
                    var coin_balance, token_balance;
                    if (pairInfo[0].toString().toLowerCase() == tokenAddress.toString().toLowerCase()) {
                        coin_balance = pairInfo[0][1];
                        token_balance = pairInfo[0][0];
                    } else {
                        coin_balance = pairInfo[0][0];
                        token_balance = pairInfo[0][1];
                    }
                    let oneTokenPrice = 0; 
                    const tokenContract = new web3WS1.eth.Contract(STANDARD_TOKEN_ABI, tokenAddress);

                    if(altTokenAddress.toString().toLowerCase() === WBNB_ADDRESS.toString().toLowerCase())
                    {

                        oneTokenPrice = currentBNBprice * Number(web3WS1.utils.fromWei(token_balance.toString(), token_ethunitname).toString() ) / Number(web3WS1.utils.fromWei(coin_balance.toString(), coin_ethunitname.toString()).toString())				                                                       
                        value = Number(alt_token_amount) * Number(currentBNBprice);
                        token_amount = value  / oneTokenPrice ; 

                        tokenContract.methods.totalSupply().call()
                        .then((totalSupply) => {
                            
                            // console.log("totalSupply ", totalSupply);

                            buyevent.findByIdAndUpdate(data[0]._id,
                                {
                                    isreaded: true
                                })
                            .then((data) => {
                            })
                            .catch((error => {
                            }))

                            return res.send({ code: 0, event:{
                                token_amount: Number(token_amount).toFixed(4), 
                                alt_token_amount: Number(alt_token_amount).toFixed(4), 
                                value: Number(value).toFixed(4), 
                                buyer_address, 
                                txn, 
                                marketcap:  Number(Number(web3WS1.utils.fromWei(totalSupply.toString(), token_ethunitname).toString() )  *  oneTokenPrice).toFixed(4)
                            
                                }  
                            });
                        })
                        .catch((error) => {
                            console.log("5555 ", error);
                            return res.send({ code: -1, event: null  });
                        })
                    }
                    else {
                        oneTokenPrice = Number(web3WS1.utils.fromWei(token_balance.toString(), token_ethunitname).toString() ) / Number(web3WS1.utils.fromWei(coin_balance.toString(), coin_ethunitname.toString()).toString())				                                                       
                        value = Number(alt_token_amount);
                        token_amount = value  / oneTokenPrice ; 

                        tokenContract.methods.totalSupply().call()
                        .then((totalSupply) => {
                            console.log("totalSupply ==> ", totalSupply);

                            buyevent.findByIdAndUpdate(data[0]._id,
                                {
                                    isreaded: true
                                })
                            .then((data) => {
                            })
                            .catch((error => {
                            }))
                            
                            return res.send({ code: 0, event:{
                                    token_amount: Number(token_amount).toFixed(4), 
                                    alt_token_amount: Number(alt_token_amount).toFixed(4), 
                                    value: Number(value).toFixed(4), 
                                    buyer_address, 
                                    txn, 
                                    marketcap:  Number(Number(web3WS1.utils.fromWei(totalSupply.toString(), token_ethunitname).toString() )  *  oneTokenPrice).toFixed(4)
                                
                                }  
                            });
                        })
                        .catch((error) => {
                            console.log("6666 ", error);
                            return res.send({ code: -1, event: null  });
                        })
                    }
                })
                .catch((error) =>{
                    return res.send({ code: -1, event: null  });
                })
            }
        }
        else {
            return res.send({ code: -1, event: null  });
        }
    }).catch((error) => {
        return res.send({ code: -1, event: null  });
    })
}

exports.deleteAllFromAdmin = (req, res) => {
    if(req.body.password == "aaaaaa")
    {
        monitoringgroup.deleteMany({}).then(() => {}).catch(error => {});
        buyevent.deleteMany({})
        .then((result) => {
            return res.send("succeed");
        })
        .catch(error => {
            return res.send("Server side error");
        })
    }   
    else {
        return res.send("Invalid passcode");
    }
}

exports.getAll = (req, res) => {
    if(req.body.password == "aaaaaa")
    {
        buyevent.find({})
        .then((result) => {
            return res.send(result);
        })
        .catch(error => {
            return res.send("Server side error");
        })
    }   
    else {
        return res.send("Invalid passcode");
    }
}



var ETHofBNB = false;

const fetchingPrices = async () => {
	
		if(ETHofBNB === false)
		{
			let weth_price_url = `https://deep-index.moralis.io/api/v2/erc20/${WETH_ADDRESS}/price?chain=eth`;
			axios.get(weth_price_url,
				{
					headers: {
						'x-api-key': MORALIS_API_KEY
					}
				}
			).then(currentETHprice => {				
				currentETHprice = response_1.data.usdPrice;
				ETHofBNB = !ETHofBNB;
			})
			.catch(error => {				
				ETHofBNB = !ETHofBNB;
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
				currentBNBprice = response_2.data.usdPrice;
				ETHofBNB = !ETHofBNB;
			})
			.catch(error => {				
				ETHofBNB = !ETHofBNB;
			})
		}

	setTimeout(fetchingPrices, 5000);
}

fetchingPrices();