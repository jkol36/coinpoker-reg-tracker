require('dotenv').config();
const { ethers } = require("ethers");
const { readFileSync } = require('fs');
const path = require('path');
const ABI = JSON.parse(readFileSync(path.join(__dirname, './erc20.json'), 'utf8'));
const Bottleneck = require("bottleneck");

// Rate limiter. 10 requests per second.
const limiter = new Bottleneck({minTime: 100});

async function getBalances() {
    const apiKey = process.env.ALCHEMY_API_KEY;
    const coinPokerHotWallet = "0xDf8DD5e0b4168f20a3488Ad088dDB198fE602Cb3";
    const coinPokerColdWallet = "0x1959D5a154162e33BebD6B993203c61B9bc1C7f8";
    const USDCaddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const CHPaddress = "0x0a6E18fB2842855C3AF925310B0F50a4BfA17909";
    const USDTaddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

    if (!apiKey) {
        console.error("API key not loaded");
        return null;
    }

    try {
        const provider = new ethers.AlchemyProvider("mainnet", apiKey);

        const USDCcontract = new ethers.Contract(USDCaddress, ABI, provider);
        const USDTcontract = new ethers.Contract(USDTaddress, ABI, provider);
        const CHPcontract = new ethers.Contract(CHPaddress, ABI, provider);

        const rawHotBalanceUSDC = await USDCcontract.balanceOf(coinPokerHotWallet);
        const rawHotBalanceUSDT = await USDTcontract.balanceOf(coinPokerHotWallet);
        const rawHotBalanceCHP = await CHPcontract.balanceOf(coinPokerHotWallet);
        const rawHotBalanceETH = await provider.getBalance(coinPokerHotWallet);

        const rawColdBalanceUSDC = await USDCcontract.balanceOf(coinPokerColdWallet);
        const rawColdBalanceUSDT = await USDTcontract.balanceOf(coinPokerColdWallet);
        const rawColdBalanceCHP = await CHPcontract.balanceOf(coinPokerColdWallet);
        const rawColdBalanceETH = await provider.getBalance(coinPokerColdWallet);

        const HotBalanceUSDC = ethers.formatUnits(rawHotBalanceUSDC, 6);
        const HotBalanceUSD = ethers.formatUnits(rawHotBalanceUSDT, 6);
        const HotBalanceCHP = ethers.formatUnits(rawHotBalanceCHP);
        const HotBalanceETH = ethers.formatEther(rawHotBalanceETH);

        const ColdBalanceUSDC = ethers.formatUnits(rawColdBalanceUSDC, 6);
        const ColdBalanceUSD = ethers.formatUnits(rawColdBalanceUSDT, 6);
        const ColdBalanceCHP = ethers.formatUnits(rawColdBalanceCHP);
        const ColdBalanceETH = ethers.formatEther(rawColdBalanceETH);

        return { 
            hotUSDC: HotBalanceUSDC,
            hotUSDT: HotBalanceUSD,
            hotCHP: HotBalanceCHP, 
            hotETH: HotBalanceETH,
            coldUSDC: ColdBalanceUSDC,
            coldUSDT: ColdBalanceUSD,
            coldCHP: ColdBalanceCHP, 
            coldETH: ColdBalanceETH,
        };

    } catch (error) {
        console.error(`Error fetching balance or alchemy provider: ${error}`);
        return null;
    }
}

// Rate-limit the function
const getBalancesRateLimited = limiter.wrap(getBalances);

module.exports = getBalancesRateLimited;

/*
// for testing run with: `node src/getBalances.js`
getBalancesRateLimited()
    .then(balances => console.log("Balances:", balances))
    .catch(error => console.error(`Error: ${error.message}`));
*/