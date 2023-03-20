

OnCartItemsChange = async (array) => {
    //send message or just use storage?
    console.log(`storage set items:`);
    console.table(array);
    let carts = {
        items: array,
        timestamp: Date.now()
    }
    await chrome.storage.sync.set({ carts: carts });
    showItems(carts);
}

let cartItems = [];

function showItems(carts) {
    $("#display2").html(JSON.stringify(carts, null, 4));
    $("#count").text(carts?.items?.length);
    $("#timeInfo").text(new Date(carts.timestamp).toLocaleString());
}

//for demo page, need reload the storage when reload.
(async function () {
    let { carts } = await chrome.storage.sync.get("carts");
    if (carts) {
        cartItems = carts.items;
        showItems(carts);
    }
    chrome.action.getBadgeText({}, (res) => {
        $("#badgeText").val(res);
    });
    chrome.action.getBadgeTextColor({}, (res) => {
        $("#txtColor").val(formatColor(res));
    });

    chrome.action.getBadgeBackgroundColor({}, (res) => {
        $("#badgeColor").val(formatColor(res));
    });

    chrome.action.getPopup({}, (page) => {
        let val = page.split('/').pop().split('.').at(0);
        $("#sel_Popup").val(val);
    })

}());

$("#addItem").click(() => {
    let name = $("#name").val();
    let weight = $("#quan").val();
    if (name?.length > 0 && weight?.length > 0) {
        let item = {
            name: name,
            quantity: weight,
            unit: 'ea'
        };
        cartItems.push(item);
        OnCartItemsChange(cartItems);
    }
});

let ClearButton = document.querySelector;

$("#clear").click(() => {
    cartItems = [];
    OnCartItemsChange(cartItems);
});

$("#btnText").click(() => {
    chrome.action.setBadgeText({ text: $("#badgeText").val().trim() });
})

//input 225,225,225,225/0
function toHex(color) {
    return color.toString(16).padStart(2, '0').toUpperCase();
}
function formatColor(color) {
    return `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}`;
}

$("#btnColor").click(async () => {
    resetbadgeText();
    let bkColor = resetColor($("#badgeColor").val());
    chrome.action.setBadgeBackgroundColor({ color: bkColor });
    $("#badgeColor").val(bkColor);//reset if before is empty.
});

function resetColor(color) {
    if (!color) {
        // Next, generate a random RGBA color
        let rdmColor = [0, 0, 0].map(() => Math.floor(Math.random() * 255));
        color = formatColor(rdmColor);
    }
    return color;
}

$("#btnBackRdm").click(async () => {
    resetbadgeText();
    let rdmColor = resetColor();
    chrome.action.setBadgeBackgroundColor({ color: rdmColor });
    $("#badgeColor").val(rdmColor);
});

$("#btnTxtColor").click(async () => {
    resetbadgeText();
    let rdmColor = resetColor($("#txtColor").val());
    chrome.action.setBadgeTextColor({ color: rdmColor });
    $("#txtColor").val(rdmColor);
});

$("#btnTxtRdm").click(async () => {
    resetbadgeText();
    let rdmColor = resetColor();
    chrome.action.setBadgeTextColor({ color: rdmColor });
    $("#txtColor").val(rdmColor);
});

async function resetbadgeText() {
    let uiText = $("#badgeText").val();
    let badgeShowText = await chrome.action.getBadgeText({});
    let uiEmpty = uiText?.length == 0;
    if (uiEmpty) {
        uiText = badgeShowText;
        $("#badgeText").val(uiText);
    }

    if (uiEmpty || uiText != badgeShowText) {
        if (uiEmpty) {
            $("#badgeText").val('(^_*)');
        }
        $("#btnText").click();
    }
}

$("#sel_Popup").change(async () => {
    let page = $("#sel_Popup").val();
    if (page) {
        let popupFile = `./popup/${page}.html`;
        chrome.action.setPopup({ popup: popupFile });
        if (page != 'offset') {
            chrome.storage.local.set({ impacts: null });
        }
    }
});