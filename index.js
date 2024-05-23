const axios = require('axios');
const cron = require('node-cron');
const keepAlive = require("/keepAlive.js")

const sync_URL = "https://api.hamsterkombat.io/clicker/sync";
const click_URL = 'https://api.hamsterkombat.io/clicker/tap';

const upgradesForBuy_URL = "https://api.hamsterkombat.io/clicker/upgrades-for-buy";
const buyBoost_URL = "https://api.hamsterkombat.io/clicker/buy-boost"; //upgradeId

const token = process.env.TOKEN;

const click = async () => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Поточний час в секундах
    try {
        const response = await axios.post(click_URL, {
            count: 1000,
            availableTaps: 0,
            timestamp: currentTimestamp
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}`);
    }
};

const getInfo = async () => {
    try {
        const response = await axios.post(sync_URL, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`Response status: ${response.status}`);
        console.log(`КІЛЬКІСТЬ МОНЕТ ЗА ГОДИНУ - ${response.data.clickerUser.totalCoins}`);
        console.log(`ЗАГАЛЬНИЙ БАЛАНС - ${response.data.clickerUser.balanceCoins}`);
        console.log(`РІВЕНЬ - ${response.data.clickerUser.level}`);
        console.log(`ДОСТУПНІ КЛІКИ - ${response.data.clickerUser.availableTaps}`);
    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}`);
    }
}

const getUpgrades = async () => {
    try {
        const response = await axios.post(upgradesForBuy_URL, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(response.data.upgradesForBuy);
    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}`);
    }
}

//every 28 minutes
cron.schedule("*/28 * * * *", () => {
    console.log("Click");
    // click();
});

//every hour
cron.schedule("0 */1 * * *", () => {
    console.log("Click");
    // click();
});

getUpgrades();
