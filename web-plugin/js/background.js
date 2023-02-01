try {
    importScripts("./common.js");
} catch (e) {
    console.error(e);
}

const GHGI_API_ADDRESS = 'https://api.sexytofu.org/api.ghgi.org:443';
const GHGI_CONFIDENCE_LIMIT = 0.3; //need try found a reasonable limit. 0.5 will ignore too much, like organic banana.
const carbonCostFeeRate = 0.1; // so far 0.1 first.
const IS_Debuger = true;

chrome.runtime.onInstalled.addListener(details => {
    if (IS_Debuger) {
        //move demo page auto open when install/update
        chrome.tabs.create({
            url: '../demo/index.html'
        });
    }

    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        //TODO: here we need a page outside of the extension to collect feedback.
        chrome.runtime.setUninstallURL("https://info.sexytofu.org/");
    }
});

//this seems never fired...
chrome.runtime.onStartup.addListener(() => {
    console.log("onstartup...");
})

//after demo changed work in side extension. seems no need here.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let response = "";

    if (message.bageText != undefined) {
        response = message.bageText;
        chrome.action.setBadgeText({ text: response });
    }
    else if (message.bageColor) {
        response = message.bageColor;
        chrome.action.setBadgeBackgroundColor({ response });
    }

    sendResponse(`message received: ${response}`);
});


function setBadge(message) {
    var popupFile = `./popup/${message.cartStatus}.html`;

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

    let results = await fetch(`${GHGI_API_ADDRESS}/rate`,
        {
            method: 'POST',
            body: JSON.stringify({ 'recipe': food })
        })
        .then(response => response.json())
        .then(json => parseResponse(json));
}

//kind of best practice to auto init
(async function () {
    let { items = [] } = await chrome.storage.sync.get("items");
    cartItems = items;
    handleCartItems(items);
}())

function handleCartItems(items) {
    let status = STATUS.Empty;
    let itemsCount = items?.length;

    if (items?.length > 0) {
        status = STATUS.NotEmpty;
    }

    setBadge({
        cartStatus: status,
        cartCount: itemsCount
    });

    if (itemsCount > 0) {
        postItems(items);
    }
    else {
        console.log(`Cart cleared.\n`);
        chrome.storage.local.set({ impacts: null });
    }
}

//TODO: use message get change from content js?
chrome.storage.sync.onChanged.addListener((changes) => {
    var items = changes.items.newValue;
    handleCartItems(items);
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
        let impact, product, matched;
        matched = item["match_conf"] >= GHGI_CONFIDENCE_LIMIT;
        if (matched) {
            impact = item["impact"] / 1000 * 2.2; // Convert from grams to pounds
            product = item["product"]?.["alias"];
        } else {
            impact = null;
            product = item["product"]?.["alias"];
        }
        cartItems.push({
            name: item["names"][0],
            product: product,
            match_conf: item["match_conf"],
            matched: matched,
            impact: impact,
            grams: item["g"]
        });
    }

    cartItems.sort((a, b) => b.impact - a.impact);
    let totalImpact = cartItems.reduce((acc, curr) => acc + curr.impact, 0);
    var status = STATUS.HaveFood;

    if (totalImpact <= 0.01) {
        status = STATUS.Empty;
    }

    setBadge({
        cartStatus: status,
        cartCount: cartItems.length
    });

    let carbonEmission = {
        matched: cartItems.reduce((acc, curr) => acc || curr.matched, false),
        totalImpact: totalImpact,
        offsetCost: totalImpact * carbonCostFeeRate,
        cartItems: cartItems,
        cartStatus: status
    };

    console.log("CartItems data:")
    console.table(cartItems);
    //save the impact to local.
    await chrome.storage.local.set({ impacts: carbonEmission });
}
