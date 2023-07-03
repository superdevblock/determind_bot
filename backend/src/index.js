const app = require("./app");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const CryptoJS = require("crypto-js");

var server = require('http').createServer(app);
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Listening on port ${port}..`));

// const httpsPort = 443;
// const privateKey = fs.readFileSync("src/cert/private.key");
// const certificate = fs.readFileSync("src/cert/radioreum_com.crt");
// const credentials = {
// 	key: privateKey,
// 	cert: certificate,
// }

// var server = https.createServer(credentials, app)
// 	.listen(httpsPort, () => {
// 		console.log(`[radioreum.com] Servier is running at port ${httpsPort} as https.`);
// 	});
 
var Web3 = require('web3');
var ObjectId = require('mongodb').ObjectID;
const platformChainIds = require("../env").platformChainIds;
const { setIntervalAsync } = require('set-interval-async/dynamic')
var ObjectId = require('mongodb').ObjectID;
const mainnet_http_RPC = require("../env").ETHEREUM_RPC_URL;
const mainnet_http_RPC1 = require("../env").BSC_RPC_URL;

var currentETHprice = 0, currentBNBprice = 0;
const GAS_STATION = 'https://api.debank.com/chain/gas_price_dict_v2?chain=eth';
const GAS_STATION1 = 'https://api.debank.com/chain/gas_price_dict_v2?chain=bsc';
const ETHER_UNITS = require("./etherunits.js");

const db = require("./db");
const { STANDARD_TOKEN_ABI, UNISWAP_ROUTER_ADDRESS, WETH_ADDRESS, UNISWAP_POOL_ABI, UNISWAP_ROUTER_ABI,  PANCAKE_ROUTER_ADDRESS, WBNB_ADDRESS, MORALIS_API_KEY } = require("../env");
const { Collection } = require("mongoose");
const MonitoringGroup = db.mornitoringgroup;
const Buyevent = db.buyevent;
const winner = db.winner;

var web3WS = new Web3(mainnet_http_RPC);
var web3WS1 = new Web3(mainnet_http_RPC1);

var scanBlockNumber = 0;
var maxBlockNumber = 0;
var scanBlockNumber1 = 0;
var maxBlockNumber1 = 0;

var TransferTemp = {};
var TransferTemp1 = {};

const compareObjects = (A, B) => {
	if (Object.keys(A).length === 0) return false;
	if (Object.keys(A).length !== Object.keys(B).length) return false;
	else {
		if (JSON.stringify(A) !== JSON.stringify(B)) return false;
	}
	console.log("----------------- same event happend ----------------");
	return true;
}

const getBlockNumber_on_eth = () => {
	web3WS.eth.getBlockNumber()
		.then((number) => {
			if (maxBlockNumber < number) {
				maxBlockNumber = number;
				if (scanBlockNumber == 0) {
					scanBlockNumber = number;
				}
				//   console.log("max block number", number);
			}
		}).catch((error) => {
			console.log("get blocknumber error");
		});
	setTimeout(getBlockNumber_on_eth, 6000);
}

const getBlockNumber_on_bsc = () => {
	web3WS1.eth.getBlockNumber()
		.then((number) => {
			if (maxBlockNumber1 < number) {
				maxBlockNumber1 = number;
				if (scanBlockNumber1 == 0) {
					scanBlockNumber1 = number;
				}
				//   console.log("max block number", number);
			}
		}).catch((error) => {
			console.log("get blocknumber error");
		});
	setTimeout(getBlockNumber_on_bsc, 3000);
}

const getData_on_eth = async () => {

	let curMaxBlock = maxBlockNumber;
	if (scanBlockNumber != 0 && scanBlockNumber < curMaxBlock) {
		// console.log('scanFrom : ', scanBlockNumber, " scanTo : ", curMaxBlock);
		try {
			await Transfer_monitor_on_eth(scanBlockNumber, curMaxBlock);
			scanBlockNumber = curMaxBlock + 1;
		} catch (e) {
		}
	}
	setTimeout(getData_on_eth, 12000);
}

const getData_on_bsc = async () => {

	let curMaxBlock = maxBlockNumber1;
	if (scanBlockNumber1 != 0 && scanBlockNumber1 < curMaxBlock) {
		// console.log('scanFrom : ', scanBlockNumber1, " scanTo : ", curMaxBlock);
		try {
			await Transfer_monitor_on_bsc(scanBlockNumber1, curMaxBlock);
			scanBlockNumber1 = curMaxBlock + 1;
		} catch (e) {
		}
	}
	setTimeout(getData_on_bsc, 6000);
}

const Transfer_monitor_on_eth = async (blockNumber, toBlockNumber) => {
	try 
	{
		//get lists of started buying group and get wallet lists of them
		MonitoringGroup.find({
			chainId: "1"
		})
		.then(async (docs) => {
			var transferPromises = [];
			for(let idx=0; idx<docs.length; idx ++)
			{
				// console.log("monitoring docs[idx].groupid  ===> ", docs[idx].groupid, docs[idx].pooladdress);
				// console.log("docs[idx]._id  ===> ", docs[idx]._id);
				// console.log("docs[idx].alttokenaddress  ===> ", docs[idx].alttokenaddress);
				try{
					var tokenContract = new web3WS.eth.Contract(UNISWAP_POOL_ABI, docs[idx].pooladdress);
					transferPromises.push(tokenContract.getPastEvents("Swap", { fromBlock: blockNumber, toBlock: toBlockNumber }));
				}catch(error){
					console.log(`Transfer_monitor_on_eth ${docs[idx].groupid} , ${docs[idx].alttokenaddress} : `, error.message);					
					MonitoringGroup.deleteOne({_id: docs[idx]._id }).then(() => {}).catch(() => {});
					continue;
				}
			}
			Promise.all(transferPromises)
			.then(async (transferEventslist) =>
			{
				console.log("transferEventslist.length ==> ", transferEventslist.length);
				for(let idx1 = 0; idx1 < transferEventslist.length; idx1 ++)
				{
					const EventlistOfMultipleTokens = transferEventslist[idx1];
					if (EventlistOfMultipleTokens.length > 0) {
						let i;
						for (i = 0; i < EventlistOfMultipleTokens.length; i++) {
							let data = EventlistOfMultipleTokens[i];	
							let objTemp = data.returnValues;
							// console.log("1 event ===> ", objTemp);
												
							const txHash = data.transactionHash;
							const amount0In = objTemp.amount0In;
							const amount1In = objTemp.amount1In;
							const amount0Out = objTemp.amount0Out;
							const amount1Out = objTemp.amount1Out;

							try{
								await checkBuyAndRecord(web3WS, docs[idx1], txHash, amount0In, amount1In, amount0Out, amount1Out);
							}catch(error)
							{
								continue;
							}
						}
					} else {
						return;
					}
				}
			})
			.catch((error) => {
				console.log(error);
			})			
		})
		.catch((error) => {
			console.log(error);
			return;
		})		
	} catch (error) {
		console.log("Something went wrong 2: " + error.message)
	}
}

const Transfer_monitor_on_bsc = async (blockNumber, toBlockNumber) => {
	try 
	{
		//get lists of started buying group and get wallet lists of them
		await MonitoringGroup.find({
			chainId: "56"
		})
		.then(async (docs) => {
			var transferPromises = [];
			for(let idx=0; idx<docs.length; idx ++)
			{
				try{
					// console.log("monitoring docs[idx].groupid  ===> ", docs[idx].groupid, docs[idx].pooladdress);
					var tokenContract = new web3WS1.eth.Contract(UNISWAP_POOL_ABI, docs[idx].pooladdress);
					transferPromises.push(tokenContract.getPastEvents("Swap", { fromBlock: blockNumber, toBlock: toBlockNumber }));
				}catch(error){
					console.log(`Transfer_monitor_on_bsc ${docs[idx].groupid} ${docs[idx].alttokenaddress} : `, error.message);
					MonitoringGroup.deleteOne({_id: docs[idx]._id }).then(() => {}).catch(() => {});
					continue;
				}
			}
			await Promise.all(transferPromises)
			.then( async (transferEventslist) =>
			{
				console.log("transferEventslist.length ==> ", transferEventslist.length);
				for(let idx1 = 0; idx1 < transferEventslist.length; idx1 ++)
				{
					const EventlistOfMultipleTokens = transferEventslist[idx1];
					if (EventlistOfMultipleTokens.length > 0) 
					{
						let i;
						for (i = 0; i < EventlistOfMultipleTokens.length; i++) 
						{
							let data = EventlistOfMultipleTokens[i];	
							let objTemp = data.returnValues;
							// console.log("56 event ===> ", objTemp);
												
							const txHash = data.transactionHash;
							const amount0In = objTemp.amount0In;
							const amount1In = objTemp.amount1In;
							const amount0Out = objTemp.amount0Out;
							const amount1Out = objTemp.amount1Out;

							try{
								await checkBuyAndRecord(web3WS1, docs[idx1], txHash, amount0In, amount1In, amount0Out, amount1Out);
							}catch(error)
							{
								continue;
							}
						}
					} else {
						continue;
					}
				}
			})
			.catch((error) => {
				console.log(error);
			})			
		})
		.catch((error) => {
			console.log(error);
			return;
		})		
	} catch (error) {
		console.log("Something went wrong 1: " + error.message)
	}
}

const checkBuyAndRecord = async (web3Obj, groupInfo, txHash, amount0In, amount1In, amount0Out, amount1Out) => {	
	try{
		let isTheTokenAtFirst = false;
		if(web3Obj.utils.toBN(groupInfo.tokenaddress).lt(web3Obj.utils.toBN((groupInfo.alttokenaddress))) === true )
		{
			isTheTokenAtFirst === true;
		}				
		if(isTheTokenAtFirst === true)
		{
			if(web3Obj.utils.toBN(amount1In) > 0 && web3Obj.utils.toBN(amount0Out) > 0)
			{									
				const ethunitname = Object.keys(ETHER_UNITS).find(key => Math.pow(10, groupInfo.tokendecimals).toString() == ETHER_UNITS[key] );								
				let tokenReal = web3Obj.utils.fromWei(value.toString(), ethunitname.toString());
				console.log("txHash ===> ", txHash)	

				await recordBuyEvent(web3Obj, txHash, groupInfo, tokenReal);
			}
		}else {		
			if(web3Obj.utils.toBN(amount0In) > 0 && web3Obj.utils.toBN(amount1Out) > 0)
			{											
				const ethunitname = Object.keys(ETHER_UNITS).find(key => Math.pow(10, groupInfo.tokendecimals).toString() == ETHER_UNITS[key] );								
				let tokenReal = web3Obj.utils.fromWei(amount1Out.toString(), ethunitname.toString());
				
				await recordBuyEvent(web3Obj, txHash, groupInfo, tokenReal);
			}
		}
	}catch(error){
		console.log("checkBuyAndRecord() error : ", error);
	}
}

const recordBuyEvent = async (web3Obj, txHash, groupInfor, tokenReal ) => {
	await web3Obj.eth.getTransaction(txHash)
	.then(responsOfHash => {			
		// console.log("responsOfHash ===> ", responsOfHash)					
		new Buyevent({
			groupid: groupInfor.groupid,
			chainid: groupInfor.chainid,
			tokenaddress: groupInfor.tokenaddress,
			tokendecimals: groupInfor.tokendecimals,
			pooladdress: groupInfor.pooladdress,
			alttokenaddress: groupInfor.alttokenaddress,
			alttokendecimals: groupInfor.alttokendecimals,
			buyerwallet: responsOfHash.from,
			amount: tokenReal,
			isreaded: false,
			txhash: txHash,
			minbuy: groupInfor.compminbuy
		}).save()
		.then(data => {										
			console.log("savedData ===> ", data)
		}).catch(error => {});
	}).catch(error => {
		console.log("bsc recordBuyEvent  : ", error.message);
	});
}

const autoPay2Winners = () => {

	setIntervalAsync(
	async () => {

		winner.find({
			isPaid: false
		})
		.then(async (unpaidwinners) => {
			
			if(unpaidwinners.length <= 0)
			{
				console.log("no unpaid winners")
			}
			else {
				// console.log("autoPay2Winners 000 unpaidwinners ==>", unpaidwinners)
				try
				{
					for(let idx = 0; idx < unpaidwinners.length; idx ++)
					{
						if(unpaidwinners[idx].chainid == 56)
						{
							var TargetTokenContract = new web3WS1.eth.Contract(STANDARD_TOKEN_ABI, unpaidwinners[idx].alttokenaddress);
							var UserEncryptedPrKey = unpaidwinners[idx].paymentWalletKey;
							var bytes  = CryptoJS.AES.decrypt(UserEncryptedPrKey, process.env.SUSTAINABLE_B);
							var decryptedPrKey = bytes.toString(CryptoJS.enc.Utf8);
							var GroupAdminAccount = web3WS1.eth.accounts.privateKeyToAccount(decryptedPrKey);
							const token_ethunitname = Object.keys(ETHER_UNITS).find(key => Math.pow(10, unpaidwinners[idx].alttokendecimals).toString() == ETHER_UNITS[key] );
							console.log("token_ethunitname ===> ", token_ethunitname);     
							if(unpaidwinners[idx].alttokenaddress.toString().toLowerCase() === WBNB_ADDRESS.toString().toLowerCase())
							{        
								const payamountinwei = web3WS1.utils.toWei(unpaidwinners[idx].wonamount.toString(),  "ether");
								console.log("payamountinwei = ", payamountinwei);
								await SignAndSendTransaction(web3WS1, GroupAdminAccount, "0x", "21000", unpaidwinners[idx].wonwallet, payamountinwei, unpaidwinners[idx].chainid, unpaidwinners[idx].eventHash); 
							}
							else {
								const payamountinwei = web3WS1.utils.toWei(unpaidwinners[idx].wonamount.toString(),  token_ethunitname.toString());
								const walletBalanceOfToken = await TargetTokenContract.methods.balanceOf(GroupAdminAccount.address).call();   
								let givAward = TargetTokenContract.methods.transfer(unpaidwinners[idx].wonwallet, payamountinwei);
								let encodedTrx = givAward.encodeABI();
								let gasFee = await givAward.estimateGas({ from: GroupAdminAccount.address });
								await SignAndSendTransaction(web3WS1, GroupAdminAccount, encodedTrx, gasFee, unpaidwinners[idx].alttokenaddress, 0, unpaidwinners[idx].chainid, unpaidwinners[idx].eventHash);
							}
						}
						if(unpaidwinners[idx].chainid == 1)
						{
							var TargetTokenContract = new web3WS.eth.Contract(STANDARD_TOKEN_ABI, unpaidwinners[idx].alttokenaddress);
							var UserEncryptedPrKey = unpaidwinners[idx].paymentWalletKey;
							var bytes  = CryptoJS.AES.decrypt(UserEncryptedPrKey, SUSTAINABLE_B);
							var decryptedPrKey = bytes.toString(CryptoJS.enc.Utf8);
							var GroupAdminAccount = web3WS.eth.accounts.privateKeyToAccount(decryptedPrKey);
							const token_ethunitname = Object.keys(ETHER_UNITS).find(key => Math.pow(10, unpaidwinners[idx].alttokendecimals).toString() == ETHER_UNITS[key] );
							console.log("token_ethunitname ===> ", token_ethunitname);
							if(unpaidwinners[idx].alttokenaddress.toString().toLowerCase() === WETH_ADDRESS.toString().toLowerCase())
							{        
								const payamountinwei = web3WS.utils.toWei(unpaidwinners[idx].wonamount.toString(),  "ether");
								await SignAndSendTransaction(web3WS, GroupAdminAccount, "0x", "30000", unpaidwinners[idx].wonwallet, payamountinwei, unpaidwinners[idx].chainid, unpaidwinners[idx].eventHash); 
							}
							else {
								const payamountinwei = web3WS.utils.toWei(unpaidwinners[idx].wonamount.toString(),  token_ethunitname.toString());
								const walletBalanceOfToken = await TargetTokenContract.methods.balanceOf(GroupAdminAccount.address).call();   
								let givAward = TargetTokenContract.methods.transfer(unpaidwinners[idx].wonwallet, payamountinwei);
								let encodedTrx = givAward.encodeABI();
								let gasFee = await givAward.estimateGas({ from: GroupAdminAccount.address });
								await SignAndSendTransaction(web3WS, GroupAdminAccount, encodedTrx, gasFee, unpaidwinners[idx].alttokenaddress, 0, unpaidwinners[idx].chainid, unpaidwinners[idx].eventHash);
							}
						}
					}
				}catch(error){
					// console.log("autoPay2Winners 1 : ", error);
				}
			}
			
		})
		.catch(error => {
			console.log("autoPay2Winners 2 : ",  error);
		})	
	}, 30 * 1000);
}


const SignAndSendTransaction = async (web3WS, admin_wallet, encodedFunc, gasfee, contractAddress, nativeValue, chainId, evHash = "") => {
	if(chainId != 1 && chainId != 56) return;
	try {
		const gasPrice = (await getCurrentGasPrices(chainId)).medium;
		var balanceOfAdmin = await web3WS.eth.getBalance(admin_wallet.address);
		if (balanceOfAdmin <= gasfee * gasPrice) {
			console.error("Insufficient balance. balanceOfAdmin = ", balanceOfAdmin, "gasFee*gasPrice = ", gasfee * gasPrice)
			return null;
		}
		let nonce = await web3WS.eth.getTransactionCount(admin_wallet.address, "pending");
		nonce = web3WS.utils.toHex(nonce);
		var tx = {
			from: admin_wallet.address,
			to: contractAddress,
			gas: gasfee,
			gasPrice: gasPrice,
			data: encodedFunc,
			value: nativeValue,
			nonce
		};
		var signedTx = await admin_wallet.signTransaction(tx);
		let trxHash = "";
		await web3WS.eth.sendSignedTransaction(signedTx.rawTransaction)
			.on('transactionHash', function (hash) {
				console.log("ts hash = ", hash);
				trxHash = hash;
			})
			.on('receipt', function (receipt) {
				console.log("")
				console.log('----------------------  tx sent ---------------------')
				console.log(" ")
				if(evHash != "")
				{
					winner.find({
						eventHash: evHash
					})
					.then((docs) => {
						if(docs.length > 0)
						{
							winner.findByIdAndUpdate(
								docs[0]._id,
								{
									isPaid: true,
									paid_tx: trxHash
								}
							).then(data => {
								console.log("saved paid winner : ", data);
							}).catch(error => {
								console.log("saving  paid winner : ", error);
							})
						}
						else {
							console.log("no record with this hash : ", evHash);								
						}
					})
					.catch(error => {		
						console.log("update winner record : ", error);				
					})
				}
			})
			.on('error', function (error, receipt) {
				console.log("")
				console.log('----------------------  tx failed ---------------------')
				console.error(" ")
			});
	} catch (err) {
		console.log("SignAndSendTransaction() exception 3 : ", err);
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

const getCurrentGasPrices = async ( chainId = 1) => {
	if(chainId == 1)
	{
		try {
		var response = await axios.get(GAS_STATION);
		var prices = {
			low: response.data.data.slow.price ,
			medium: response.data.data.normal.price ,
			high: response.data.data.fast.price,
		};
		let log_str =
			"High: " +
			prices.high +
			"        medium: " +
			prices.medium +
			"        low: " +
			prices.low;
			console.log(log_str);
		return prices;
		} catch (error) {
			console.log(error);
		throw error;
		}
	}
	else if(chainId == 56) 
	{		
		try {
			var response = await axios.get(GAS_STATION1);
			var prices = {
				low: response.data.data.slow.price ,
				medium: response.data.data.normal.price ,
				high: response.data.data.fast.price,
			};
			let log_str =
				"High: " +
				prices.high +
				"        medium: " +
				prices.medium +
				"        low: " +
				prices.low;
				console.log(log_str);
			return prices;
		} catch (error) {
			console.log(error);
		throw error;
		}
	}
}

fetchingPrices();
autoPay2Winners();


getBlockNumber_on_eth();
getData_on_eth();


getBlockNumber_on_bsc();
getData_on_bsc();

