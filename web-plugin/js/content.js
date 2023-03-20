window.addEventListener("click", notifyExtension);
console.info("sexy-tofu extenstion start to inject content.js...");

OnCartItemsChange = async (array) => {
    //send message or just use storage?
    console.log('current cart items:');
    console.table(array);

    //add time flag for clear cache after outdated. now: 24h.
    let carts = {
        items: array,
        timestamp: Date.now()
    }
    await chrome.storage.sync.set({ carts: carts });
}

function setOutDated(isOutDated) {
    chrome.runtime.sendMessage({
        action: isOutDated ? 'OutDated' : 'Normal'
    })
}

/* The InstaCart Cart "button" consists of 3 parts: a path, a span, and an svg (the cart icon). This function verifies that the 
"button" was clicked by checking if the target of user click had the attribute of any of these three parts.
*/
function notifyExtension(e) {
    let isHomePage = window.location.pathname.trim().toLowerCase().endsWith('/store');
    if (isHomePage) {//home page area skip any actions. include Cart Button.
        return;
    }

    let $target = $(e.target);
    let origTagName = e.target?.tagName?.toLowerCase();
    let $targetBtn = $target.closest("button");
    let ariaLabel = $targetBtn.attr("aria-label")?.toLowerCase() ?? "";
    let btnText = $targetBtn.text().toLowerCase();

    if (origTagName != 'span' && origTagName != 'button' && origTagName != 'svg' && origTagName != 'path'
        && ($targetBtn.length == 0 && origTagName == 'div')) {
        return;
    }

    //view cart button clicked
    if (ariaLabel?.includes("view cart")) {
        waitThenScrapeCart();
    }
    console.info('Button Clicked: ', $targetBtn.length > 0 ? $targetBtn.prop("outerHTML") :
        $target.prop("outerHTML"));

    //$targetBtn.length == 0 means the button dispear after click or do not have button parent.
    if (isCartUIVisible()) {
        //Img button version, before 2023.03. But not sure if it will show again?
        let isRetailBtn = $targetBtn.find(".RetailerLogo").length > 0;
        //2023.3.19 append is retail row.
        let isRetailRow = $targetBtn.find('span[data-testid="retailer-name"]').length > 0;

        if (isRetailBtn || isRetailRow ){
            //Sometimes it will read to old cart data... hard to reproduct, but occurs.
            waitThenScrapeCart(1000);
        }
        else if(ariaLabel.includes("increment") || $targetBtn.length == 0 ||
            ariaLabel.includes("decrement") || ariaLabel.includes("remove") || btnText == 'remove') {
            waitThenScrapeCart();
        }
    }
    else if (ariaLabel.includes("add") || ariaLabel.includes("remove")
        || ariaLabel.includes("increment") || ariaLabel.includes("decrement")
        || $targetBtn.length == 0 || btnText.includes('add ') || btnText == 'update quantity') {
        console.info('Need reopen the cart again!')
        setOutDated(true);

    }
}

function isCartUIVisible() {
    //$('div[aria-label="Cart"]:visible'), get visible cart obj
    return $('div[aria-label="Cart"]').is(':visible');
}

let retryTimes = -1;
const MAX_RETRY = 30; // 300 * 30 = 9s. total around 9.5s
let scrapeTimer = null;

async function waitThenScrapeCart(timeout = 500) {
    clearTimeout(scrapeTimer);//cancel the before timer first.
    console.log(`Go to read  carts, wait ${timeout}ms first: ${new Date().toLocaleString()}`);

    //This used to handle when cartBody can't load out, maybe network error and so on.
    retryTimes = 0;

    scrapeTimer = setTimeout(scrapeCart, timeout);
}

function scrapeCart(timeoutBeforeRetry = 300) {
    //if user have exit the cart, need set OutDated.
    if (!isCartUIVisible()) {
        console.log("User exit the cart UI, we can't read cart items now...")
        setOutDated(true);
        return;
    }

    //here to make sure cartbody is loaded.
    if (!$('div[id="cart-body"]').is(':visible')) {
        if (retryTimes > MAX_RETRY) {
            console.error(`Cart Body still not ready. currentTime: ${new Date().toLocaleString()}`);
            return;
        }

        console.log(`Cart Body not ready, wait ${timeoutBeforeRetry}ms again: ${new Date().toLocaleString()}`);

        scrapeTimer = setTimeout(scrapeCart, timeoutBeforeRetry);
        retryTimes++;
        return;
    }

    console.log(`Print start: ${new Date().toLocaleString()}`);
    let items = document.querySelectorAll('div[aria-label="product"]');
    let cartItems = [];
    setOutDated(false);

    for (i = 0; i < items.length; ++i) {
        item = items[i];

        //TODO: add error report, send mail or let user send feedback?
        //TODO: still need improve logic for reading the cart items...
        if (item.childElementCount == 2) {
            textNode = item.firstChild.lastChild.firstChild;

            try {
                foodName = textNode.firstChild.firstChild.textContent;
                unit = textNode.firstChild.lastChild.textContent;
                quantity = textNode.firstChild.nextElementSibling.textContent;

                let food = BuildFoodItem(foodName, unit, quantity)
                cartItems.push(food);
            }
            catch {
                console.warn('read cart item error:', textNode.outerHTML);
            }
        }
        else {
            // Alternative logic as a backup
            allTextContent = item.textContent;
            console.error("TODO: read cart item failed: ", allTextContent);

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
            // console.log(`before unit: ${unit}, quantity: ${quantity}`);
            quantity = numb * quantity;
            unit = unit.replace(numb, '').trim().toLowerCase();

            //remove container words, like: bag, container, count ...
            UNIT_RemoveWords.forEach((word) => {
                unit = unit?.replace(word, "").trim();
            });

            //convert some speical unit, like: fl oz, ct, oz bunch
            if (UNIT_Convert[unit]) {
                unit = UNIT_Convert[unit];
            }

            // console.log(`after unit: ${unit}, quantity: ${quantity}`);
        }
        else if (unit == 'each' || unit.startsWith("per ")) {
            unit = "ea";
        }
    }

    return {
        name: foodName,
        quantity: quantity,
        unit: unit
    };
}