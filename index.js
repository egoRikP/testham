const axios = require('axios');
const cron = require('node-cron');
const keepAlive = require("./keepAlive.js");

const baseURL = "https://api.hamsterkombat.io/clicker/";
const endpoints = {
    sync: "sync",
    tap: "tap",
    upgradesForBuy: "upgrades-for-buy",
    buyUpgrade: "buy-upgrade",
    buyBoost: "buy-boost"
};

const token = process.env.TOKEN;

const currentTimestamp = () => Math.floor(Date.now() / 1000);

const sendRequest = async (endpoint, data) => {
    try {
        const response = await axios.post(baseURL + endpoint, {
            timestamp: currentTimestamp(),
            ...data,
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(`Помилка в надсиланні запиту на ${endpoint}: ${error.response ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message}`);
    }
};

const tap = async () => sendRequest(endpoints.tap, {count: 1000, availableTaps: 0});
const getInfo = async () => sendRequest(endpoints.sync);
const getUpgrades = async () => sendRequest(endpoints.upgradesForBuy);

const buyUpgradeOrBoost = async ({upgradeId, boostId}) => {
    const endpoint = upgradeId ? endpoints.buyUpgrade : endpoints.buyBoost;
    const id = upgradeId || boostId;
    try {
        await sendRequest(endpoint, {upgradeId, boostId, timestamp: currentTimestamp()});
        console.log(`Успішно куплено ${upgradeId ? 'апгрейд' : 'буст'} з ID: ${id}`);
    } catch (error) {
        if (error.response && error.response.data && error.response.data.error_code === "INSUFFICIENT_FUNDS") {
            console.error(`Недостатньо коштів для покупки ${upgradeId ? 'апгрейду' : 'бусту'} з ID: ${id}`);
        } else {
            console.error(`Помилка покупки ${upgradeId ? 'апгрейду' : 'бусту'} з ID: ${id}: ${error.response ? error.response.data.error_code : error.message}`);
        }
    }
};

const buyUpgrades = async (items) => {
    for (const item of items) {
        if (item.id) {
            await buyUpgradeOrBoost({upgradeId: item.id});
        } else {
            console.error('Помилка: ID апгрейду або бусту не надано для елемента', item);
        }
    }
};

const processUpgrades = async () => {
    try {
        const {upgradesForBuy} = await getUpgrades();
        const bestOffers = analyzeUpgrades(upgradesForBuy);
        console.log("Найвигідніші доступні акції:");
        bestOffers.forEach((offer, index) =>
            console.log(`${index + 1}. ID: ${offer.id}, Назва: ${offer.name}, Ціна: ${offer.price}, Профіт: ${offer.profitPerHourDelta}, Відношення профіту до ціни: ${(offer.profitPerHourDelta / offer.price).toFixed(5)}`)
        );
        await buyUpgrades(bestOffers);
    } catch (error) {
        console.error('Помилка обробки апгрейдів:', error.message);
    }
};

const analyzeUpgrades = (upgrades) =>
    upgrades
        .filter(upgrade => upgrade.isAvailable && !upgrade.isExpired)
        .map(upgrade => ({
            ...upgrade,
            profitToPriceRatio: upgrade.profitPerHourDelta / upgrade.price
        }))
        .sort((a, b) => b.profitToPriceRatio - a.profitToPriceRatio)
        .slice(0, 3);

const processTap = async () => {
    try {
        console.log("ПРОЙШЛО 33 ХВ - КЛІКАЮ!");
        await tap();
        await processUpgrades();
    } catch (error) {
        console.error('Помилка під час кліка:', error.message);
    }
};

const processFreeTapsAndTap = async () => {
    try {
        console.log("ПРОЙШЛИ 3 ГОДИНИ - БЕРЕМО ФРІ КЛІКИ!");
        await buyUpgradeOrBoost({boostId: "BoostFullAvailableTaps"});
        await tap();
    } catch (error) {
        console.error('Помилка під час покупки фрі кліків або кліка:', error.message);
    }
};

cron.schedule("*/33 * * * *", processTap);
cron.schedule("0 0 */3 * * *", processFreeTapsAndTap);


// Import the required modules
const fs = require('fs');

// Path to the file
const filePath = '/etc/secrets/test.txt';

// Function to read and log the file content
const readFileAndLog = () => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file:', err);
            return;
        }
        console.log('File content:', data);
    });
};

// Schedule the task to run every 30 seconds
cron.schedule('* * * * * *', readFileAndLog);

console.log('Cron job started. Reading file every 30 seconds.');
