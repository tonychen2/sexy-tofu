//Common.js contains many const & options settings.
try {
    importScripts("./common.js");
} catch (e) {
    console.error(e.message);
}

chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        //TODO: here we need a page outside of the extension to collect feedback.
        chrome.runtime.setUninstallURL("https://info.sexytofu.org/");
    }
});

function setBadge(message) {
    let popupFile = `./popup/${message.cartStatus}.html`;
    chrome.action.setPopup({ popup: popupFile });

    let text = message.cartCount.toString();
    if (text == '0' || text == undefined || text == null) {
        { chrome.action.setBadgeText({ text: '' }); }
    }
    else { chrome.action.setBadgeText({ text }); }
}

async function postItems(items) {
    //build items postdata.
    let food = [];
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (item["unit"] === "ea") {//here need more logic
            food.push(`${item["quantity"]} ${item["name"]}`);
        } else {
            food.push(`${item["quantity"]} ${item["unit"]} of ${item["name"]}`);
        }
    }
    if (IS_Debuger) {
        console.time('Ghgi request');
    }

    let results = await fetch(`${GHGI_API_ADDRESS}/rate`,
        {
            method: 'POST',
            body: JSON.stringify({ 'recipe': food })
        })
        .then(response => response.json())
        .then(json => parseResponse(json));

    if (IS_Debuger) {
        console.timeEnd('Ghgi request');
    }
}

function validDateCartItems(alarm) {
    if ('validCartItems' == alarm.name) {
        let json = JSON.stringify(alarm);
        console.log(`Alarm "${alarm.name}" fired at ${new Date().toLocaleString()}\n${json}}`);
        chrome.storage.sync.set({ carts: null });
        chrome.alarms.clear(alarm.name);
    }
}

chrome.alarms.onAlarm.addListener(validDateCartItems);

//kind of best practice to auto init
async function InitData() {
    let { carts } = await chrome.storage.sync.get("carts");
    let items = [];

    chrome.action.setBadgeTextColor({ color: DefaultTextColor });

    if (carts) {
        items = carts.items;
        timestamp = carts.timestamp;

        timestamp = Number(timestamp);
        if (timestamp) {
            timestamp += Expire_Period;
            if (Date.now() > timestamp) {
                items = [];//clear the cart items.
            }
            else {//create alarm
                chrome.alarms.create("validCartItems", { when: timestamp });
            }
        }
    }
    handleCartItems(items);
}

InitData();

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    //1. retry to calc
    //2. set carts outdated
    let action = message.action?.toString();
    if (action) {
        switch (action) {
            case 'Refresh':
                console.log('start to re-calcuation again...');
                InitData();
                break;
            case 'OutDated':
                console.log('Cart items outdated, change badge background color.');
                let popupFile = `./popup/Outdated.html`;
                chrome.action.setPopup({ popup: popupFile });
                chrome.action.setBadgeBackgroundColor({ color: OutDatedColor });
                break;
            case 'Normal':
                console.log('Cart items refreshed, change badge background color to normal.');
                chrome.action.setBadgeBackgroundColor({ color: DefaultColor });
                break;
            //not send message again. only handle in handleCartItems
            // case 'isCalcuating': 
            //     setIsCalcuating(true);
            //     break;
        }
    }

    let debug = message.Debug?.toString();
    if (debug) {
        switch (debug.toLowerCase()) {
            case "on":
            case "1":
            case "true":
                IS_Debuger = true;
                //open demo page, when get message to open debug.
                chrome.tabs.create({
                    url: '../demo/index.html'
                });
                break;
            default:  //"off", "0", "false"
                IS_Debuger = false
                break;
        }
    }
});

async function handleCartItems(items) {

    let itemsCount = items ? items.length : 0;
    let status = itemsCount > 0 ? STATUS.HaveFood : STATUS.Empty;

    setBadge({
        cartStatus: status,
        cartCount: itemsCount
    });

    setIsCalcuating(true);

    if (itemsCount > 0) {
        console.log(`Cart items received at ${new Date().toLocaleString()}`)
        try {
            await postItems(items);
        }
        catch
        {
            //Request_Error
            setBadge({
                cartStatus: STATUS.ERROR,
                cartCount: itemsCount
            });
            chrome.storage.local.set({ impacts: null });
        }
    }
    else {
        chrome.storage.local.set({ impacts: null });
        console.log(`Cart cleared.\n`);
    }

    setIsCalcuating(false);
}

function setIsCalcuating(flag) {
    chrome.storage.local.set({ isCalcuating: flag });
}

//when get cart items changes
chrome.storage.sync.onChanged.addListener((changes) => {
    let carts = changes.carts;
    if (carts) {
        items = carts.newValue?.items;
        timestamp = carts.newValue?.timestamp;
        if (items) {
            let expireTime = Number(timestamp) + Expire_Period;
            chrome.alarms.create("validCartItems", { when: expireTime });
        }
        handleCartItems(items);
    }
})

const parseResponse = async (json) => {
    /**
     * Parse response from GHGI API to access data points for display
     *
     * @param    {String} json      Response body in json format
     *
     * @return   {Object}  Requested data points
     */

    let cartItems = [];
    // Find impact of each ingredient and rank them
    for (let item of json["items"]) {
        let product, matched, impact;
        matched = item["match_conf"] >= GHGI_CONFIDENCE_LIMIT;
        impact = item["impact"] ? item["impact"] : 0; //in "g"
        product = item["product"]?.["alias"];

        cartItems.push({
            name: item["names"][0],
            product: product,
            match_conf: item["match_conf"],
            matched: matched,
            origImpact: impact,
            grams: item["g"]
        });
    }

    let totalOrigImpact = cartItems.reduce((total, item) => total + item.origImpact, 0);
    let totalImpact = cartItems.reduce((total, item) => total + (item.matched ? item.origImpact : 0), 0);
    let offsetCost = totalImpact * CarbonCostFeeRate;
    let status = STATUS.HaveFood;
    if (offsetCost < ZERO) {
        status = STATUS.Empty;
        setBadge({
            cartStatus: status,
            cartCount: cartItems.length
        });
    }
    else if (offsetCost < MIN_COST) {
        offsetCost = MIN_COST;
    }

    let carbonEmission = {
        matched: cartItems.reduce((acc, curr) => acc || curr.matched, false),
        totalImpact: totalImpact * G_TO_POUND, //here convert to lb
        totalOrigImpact: totalOrigImpact,
        offsetCost: offsetCost,
        cartItems: cartItems,
        cartStatus: status
    };

    if (IS_Debuger) {
        console.log("CartItems data:")
        console.table(cartItems);
    }
    //save the impact to local.
    await chrome.storage.local.set({ impacts: carbonEmission });
}