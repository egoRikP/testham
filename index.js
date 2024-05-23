const axios = require('axios');
const cron = require('node-cron');

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
        const currentTimestamp = Math.floor(Date.now() / 1000); // Поточний час в секундах

        const response = await axios.post(upgradesForBuy_URL, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const upgrades = response.data.upgradesForBuy;
        const bestOffers = analyzeUpgrades(upgrades);

        console.log("Найвигідніші доступні акції:");
        bestOffers.forEach((offer, index) =>
            console.log(`${index + 1}. ID: ${offer.id}, Назва: ${offer.name}, Ціна: ${offer.price}, Профіт: ${offer.profitPerHourDelta}, Відношення профіту до ціни: ${(offer.profitPerHourDelta / offer.price).toFixed(2)}`)
        );


    } catch (error) {
        console.error(`Error: ${error.response ? error.response.status : error.message}`);
    }
}

function analyzeUpgrades(upgrades) {
    return upgrades
        .filter(upgrade => upgrade.isAvailable)
        .map(upgrade => ({
            ...upgrade,
            profitToPriceRatio: upgrade.profitPerHourDelta / upgrade.price
        }))
        .sort((a, b) => b.profitToPriceRatio - a.profitToPriceRatio)
        .slice(0, 3);
}

async function buySelectedOffers(offers, timestamp, token) {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Поточний час в секундах
    for (const offer of offers) {
        console.log(offer.id)
        try {
            await axios.post(buyBoost_URL, {
                upgradeId: offer.id,
                timestamp: currentTimestamp
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log(`Покупка акції "${offer.name}" з ID ${offer.id} виконана успішно.`);
        } catch (error) {
            console.error(`Помилка під час покупки акції "${offer.name}" з ID ${offer.id}:`, error.message);
        }
    }

    try {
        const tapResponse = await axios.post(tap_URL, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`Залишилося монет: ${tapResponse.data.clickerUser.balanceCoins}`);
    } catch (error) {
        console.error("Помилка під час оновлення балансу монет:", error.message);
    }
}

const buyUpgrade = async (offer) => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Поточний час в секундах
    try {
        const response = await axios.post(buyBoost_URL, {
            upgradeId: offer.id,
            timestamp: currentTimestamp
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`Successfully bought upgrade: ${offer.name}`);
    } catch (error) {
        console.error(`Error buying upgrade: ${error.response ? error.response.status : error.message}`);
    }
};

click();

//every 28 minutes
cron.schedule("*/28 * * * *", () => {
    console.log("every 28 minutes - click");
    click();
});
