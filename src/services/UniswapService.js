import UNISWAP_CONTRACT from '../contracts/Uniswap';
import BigNumber from "bignumber.js/bignumber.mjs";
import { ethers } from 'ethers';

let providerCurrent = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/c3ae26636c8646b0a76798e6a23b19cf'); //provider for current blocks, has to keep at least biteSize blocks/
let providerArchive = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/c3ae26636c8646b0a76798e6a23b19cf'); //provider for "old" blocks
let iface = new ethers.utils.Interface(UNISWAP_CONTRACT.abi);
let numMyShareTokens = new BigNumber(0);
let numMintedShareTokens = new BigNumber(0);
let totalEthFees = 0.0;
let totalTokenFees = 0.0;
let tokenDecimals = 0;
let exchangeAddress = null;
let curPoolShare = 0;
let curPoolShareDisplay = 0;
let provider = providerArchive; // provider
let curEthTotal = 0;
let curTokenTotal = 0;

const data = {
    currentProfit: 0,
    liquidity: {
        eth: 0,
        tokens: 0,
        poolFees: 0,
        poolRate: 0
    },
    deposited: {
        hasDeposit: false,
        poolShare: 0,
        eth: 0.0,
        tokens: 0.0
    }
};
const biteSize = 25000; // how many blocks (or rather logs) should we request at once (for Infura should be much lower)
const providerFeePercent = 0.003;


const UniswapService = {
    tokens: () => {
        return Object.keys(UNISWAP_CONTRACT.tokens);
    },
    get: async (address, token) => {
        const curSymbol = token || "RLC";
        tokenDecimals = Math.pow(10, UNISWAP_CONTRACT.tokens[curSymbol].decimals);
        exchangeAddress = UNISWAP_CONTRACT.tokens[curSymbol].address;
        const response = await UniswapService.getLogs(UNISWAP_CONTRACT.originBlock, UNISWAP_CONTRACT.originBlock + biteSize, address);
        return response;
    },
    getLogs: async (fromBlock, toBlock, myAddress) => {
        await provider.getLogs({
            fromBlock: fromBlock,
            toBlock: toBlock,
            address: exchangeAddress
        }).then((result) => {
            result.forEach((r) => {
                let parsedResult = iface.parseLog(r);
                let eth = 0;
                let tokens = 0;
                let ethFee = 0;
                let tokenFee = 0;

                switch (parsedResult.name) {
                    case 'AddLiquidity':
                        eth = parsedResult.values.eth_amount / 1e18;
                        tokens = parsedResult.values.token_amount / tokenDecimals;
                        UniswapService.updateDeposit(parsedResult, myAddress, eth, tokens, true);
                        break;
                    case 'RemoveLiquidity':
                        eth = -parsedResult.values.eth_amount / 1e18;
                        tokens = -parsedResult.values.token_amount / tokenDecimals;
                        UniswapService.updateDeposit(parsedResult, myAddress, eth, tokens, data.deposited.hasDeposit);
                        break;
                    case 'Transfer':
                        let sender = parsedResult.values._from;
                        let receiver = parsedResult.values._to;

                        let numShareTokens = new BigNumber(parsedResult.values._value);

                        if (receiver === "0x0000000000000000000000000000000000000000") {
                            numMintedShareTokens = numMintedShareTokens.minus(numShareTokens);
                            if (sender.toUpperCase() === myAddress.toUpperCase()) {
                                numMyShareTokens = numMyShareTokens.minus(numShareTokens);
                            }
                        } else if (sender === "0x0000000000000000000000000000000000000000") {
                            numMintedShareTokens = numMintedShareTokens.plus(numShareTokens);
                            if (receiver.toUpperCase() === myAddress.toUpperCase()) {
                                numMyShareTokens = numMyShareTokens.plus(numShareTokens);
                            }
                        }
                        break;
                    case 'TokenPurchase':
                        tokens = -parsedResult.values.tokens_bought / tokenDecimals;
                        eth = parsedResult.values.eth_sold / 1e18;
                        tokenFee = (-tokens / (1 - providerFeePercent)) + tokens; // buying tokens, fee was deducted from tokens
                        break;
                    case 'EthPurchase':
                        tokens = parsedResult.values.tokens_sold / tokenDecimals;
                        eth = -parsedResult.values.eth_bought / 1e18;
                        ethFee = (-eth / (1 - providerFeePercent)) + eth;
                        break;
                    default:
                        break;

                }

                // update eth and tokens
                curEthTotal += eth;
                curTokenTotal += tokens;

                // update current pool share. take users's share tokens and divide by total minted share tokens
                curPoolShare = new BigNumber(
                    numMyShareTokens.dividedBy(numMintedShareTokens)
                );
                if (isNaN(curPoolShare) || curPoolShare.toFixed(4) === 0) {
                    curPoolShare = 0;
                    data.deposited.eth = 0;
                    data.deposited.tokens = 0;
                }

                // get a percentage from the pool share
                curPoolShareDisplay = (curPoolShare * 100).toFixed(4);

                totalEthFees += ethFee;
                totalTokenFees += tokenFee;

                let ratio = (
                    curEthTotal / curTokenTotal
                )

                let delta = (
                    (curPoolShare * curTokenTotal - data.deposited.tokens)
                    * (curEthTotal / curTokenTotal)
                    + (curPoolShare * curEthTotal - data.deposited.eth)
                ).toPrecision(4);

                data.liquidity.eth = curEthTotal.toPrecision(6);
                data.liquidity.tokens = curTokenTotal.toPrecision(8);
                data.liquidity.poolRate = ratio.toPrecision(4);
                data.liquidity.poolFees = (totalEthFees + totalTokenFees * ratio).toPrecision(4);
                data.currentProfit = delta;
                data.deposited.poolShare = curPoolShareDisplay;
            })

        }).catch((err) => {
            console.log(err);
        });


        //switch to "current" mode
        if (toBlock > await provider.getBlockNumber() - biteSize) {
            let provider = providerCurrent;
            while (true) {
                let currentBlock = await provider.getBlockNumber();
                if (currentBlock > toBlock) {
                    await UniswapService.getLogs(toBlock + 1, currentBlock, myAddress);
                }
                break;
            }
        } else {
            await UniswapService.getLogs(toBlock + 1, toBlock + biteSize, myAddress);
        }

        return data;
    },
    updateDeposit: (result, address, eth, tokens, deposited) => {
        if (result.values.provider.toUpperCase() === address.toUpperCase()) {
            data.deposited.eth = data.deposited.eth + eth;
            data.deposited.tokens = data.deposited.tokens + tokens;
            data.deposited.hasDeposit = deposited;
        }
    }
}

export default UniswapService;