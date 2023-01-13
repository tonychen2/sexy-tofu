
window.addEventListener("click", notifyExtension);
console.log("sexy-tofu extenstion start to inject content.js...")

var OnCartItemsChange = async (array) => {
    //send message or just use storage?
    console.log(`storage set items:`);
    console.log(array);
    await chrome.storage.sync.set({ items: array });
}

/* The InstaCart Cart "button" consists of 3 parts: a path, a span, and an svg (the cart icon). This function verifies that the 
"button" was clicked by checking if the target of user click had the attribute of any of these three parts.
*/
function notifyExtension(e) {
    if (e.target.tagName.toLowerCase() == "button") {
        if (e.target.getAttribute("aria-label")?.includes("View Cart")) {
            setTimeout(printCart, 5000); // to make sure DOM elements load. may change to MutationObserver()
        }
    }
    if (e.target.tagName.toLowerCase() == "path") {
        if (e.target.getAttribute("d").includes("M7")) {
            setTimeout(printCart, 5000); // to make sure DOM elements load. may change to MutationObserver()
        }
    }
    if (e.target.tagName.toLowerCase() == "span") {
        if (e.target.getAttribute("class") == "css-pvkn2g") {
            setTimeout(printCart, 5000); // to make sure DOM elements load. may change to MutationObserver()
        }
    }
    if (e.target.tagName.toLowerCase() == "svg") {
        if (e.target.getAttribute("size") == "24") {
            setTimeout(printCart, 5000); // to make sure DOM elements load. may change to MutationObserver()
        }
    }
}

function printCart() {
    // TODO: Check if it's actually the right page
    console.clear(); // personal preference
    // Previous version: scrape based on class name, yet unstable
    // On Jul 18: 'css-1k4e3ab' stopped working
    // var items = document.querySelectorAll('span[style*="color: rgb(52, 53, 56)"], div[class="rmq-a40185f5"]');
    //      for (i = 0; i < items.length; ++i) {
    //         console.log(items[i].textContent);
    //     }
    var items = document.querySelectorAll('div[aria-label="product"]');
    // TODO: Consider refactor as foreach + callback
    let cartItems = [];
    for (i = 0; i < items.length; ++i) {
        item = items[i];

        if (item.childElementCount == 2) { // TODO: Improve logic for failure check
            //unit: 6 ct,  3 lb, per lb, each
            textNode = item.firstChild.lastChild.firstChild // TODO: Handle situation where this is not true

            foodName = textNode.firstChild.firstChild.textContent;
            unit = textNode.firstChild.lastChild.textContent;
            quantity = textNode.firstChild.nextElementSibling.textContent;

            let food = BuildFoodItem(foodName, unit, quantity)
            cartItems.push(food);
        }
        else {
            // Alternative logic as a backup
            allTextContent = item.textContent;
            console.log(allTextContent);

            // TODO: Parse text content
            // TODO: Send notification
        }
    }
    OnCartItemsChange(cartItems);
}

function BuildFoodItem(foodName, unit, quantity) {
    if (unit) {
        let numb = parseFloat(unit);
        if (numb) {
            console.log(`before unit: ${unit}, quantity ${quantity}`);
            quantity = numb * quantity;
            unit = unit.replace(numb, '').trim();
            if (UNIT_Convert[unit]) {
                unit = UNIT_Convert[unit];
            }

            console.log(`after unit: ${unit}, quantity ${quantity}`);
        }
        else if (unit == 'each' || unit.startsWith("per ")) {
            unit = "ea";
        }
    }

    return new TofuItem(foodName, unit, quantity);
}

//for demo page
if (window.location.pathname.toLowerCase().endsWith('/demo.html')) {
    console.log("start for demo.html");
    let cartItems = [];
    
    //for demo page, need reload the storage when reload.
    (async function () {
        let { items = [] } = await chrome.storage.sync.get("items");
        cartItems = items;
    }());

    let addButton = document.querySelector("#addItem");
    let nameInput = document.querySelector("#name");
    let weightInput = document.querySelector("#quan");

    addButton.addEventListener('click', () => {
        if (nameInput.value?.length > 0 && weightInput.value?.length > 0) {
            var item = new TofuItem(nameInput.value, "ea", `${weightInput.value}`);
            cartItems.push(item);
            OnCartItemsChange(cartItems);
        }
    });

    let ClearButton = document.querySelector("#clear");

    ClearButton.addEventListener('click', () => {
        cartItems = [];
        OnCartItemsChange(cartItems);
    });

    let bageTxt = document.querySelector("#bageText");
    let bageTxtBtn = document.querySelector("#setText");
    let bageColor = document.querySelector("#bageColor");
    let bageColorBtn = document.querySelector("#setColor");

    bageTxtBtn.addEventListener('click', () => {
        let text = bageTxt.value?.trim();
        chrome.runtime.sendMessage({ bageText: text }, (response) => {
            console.log(response);
        });
    });

    //input 225,225,225,225/0
    function formatColor(color) {
        return `#${color[0]}${color[1]}${color[2]}`;
    }

    async function showBadgeColor(color) {
        bageColor.value = formatColor(color);
    }

    bageColorBtn.addEventListener('click', async () => {
        if (bageTxt.value?.length <= 0) {
            bageTxt.value = '(^_*)';
            bageTxtBtn.click();
        }

        // Next, generate a random RGBA color
        let color = [0, 0, 0].map(() => Math.floor(Math.random() * 255).toString(16).toUpperCase());
        let colorStr = formatColor(color);
        chrome.runtime.sendMessage({ bageColor: colorStr }, (response) => {
            console.log(response);
        });
        showBadgeColor(color);
    });
}