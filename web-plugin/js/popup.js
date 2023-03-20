let cartItems = null;
let pageUrl = window.location.pathname;

const isOffset = pageUrl.toLowerCase().endsWith('/offset.html');
const isEmpty = pageUrl.toLowerCase().endsWith('/empty.html');

//let bgPage = chrome.extension.getBackgroundPage();
//V2 function... not working anymore.
//link: https://developer.chrome.com/docs/extensions/mv3/mv3-migration-checklist/#api-background-context

let waitCalcuatingTimer = null;
let i = 0;

if (isEmpty) {
  loadCarbonImpact();
}
else {
  //TODO: Here delay 1s for let user can see the waiting message... 
  //Do we have any better way to show sometimes we are still calcuating?
  waitCalcuatingTimer = setTimeout(() => { checkIsCalcuating() }, 1000);
}

async function checkIsCalcuating() {
  let { isCalcuating } = await chrome.storage.local.get("isCalcuating");

  if (isCalcuating) {
    waitCalcuatingTimer = setTimeout(() => { checkIsCalcuating() }, 100);
  } else {
    loadCarbonImpact();
    clearTimeout(waitCalcuatingTimer);
  }
}

async function loadCarbonImpact() {
  try {
    let { impacts } = await chrome.storage.local.get("impacts");

    let status = STATUS.Empty;
    if (impacts) {
      console.info("Total Impacts:", impacts.totalImpact);
      console.info("Total Cost:", impacts.offsetCost);
      //console.info("cartItems", impacts.cartItems);

      status = impacts.cartStatus;

      if (status == STATUS.Empty) {
        if (isEmpty) {
          let h2 = document.querySelector('h2');
          h2.textContent = "Your cart has no food in it";
        }
        else {
          this.location.href = 'empty.html';
        }
      }
      else if (status == STATUS.HaveFood) {
        if (isOffset) {
          let bubbleTxt = document.querySelector('#bubbleTxt');
          let offsetBtn = document.querySelector('#paymentBtn');

          if (bubbleTxt) {
            bubbleTxt.textContent = "Here's the carbon emission for your cart!";
          }
          if (offsetBtn) {
            offsetBtn.toggleAttribute("disabled");
          }
          buildItem(impacts)
        }
        else {
          this.location.href = 'offset.html';
        }
      }
    }
  }
  catch (ex) {
    console.error('Load local storage failed. Exception as: \n', ex);
  }
}

function buildItem(impacts) {
  if (isOffset) {
    let pEmission = document.querySelector('div[class="total-emission"] span');
    pEmission.innerText = impacts.totalImpact.toFixed(1);

    let pCost = document.querySelector('div[class="offset-cost"] span');
    pCost.innerText = '$' + impacts.offsetCost.toFixed(2);
  }
}

let learnMoreBtn = document.querySelector('#learnMoreBtn');
if (learnMoreBtn) {
  learnMoreBtn.addEventListener('click', async () => {
    //we can jump in extension pages. but open third-party page must open new tabs.
    // this.location.href = 'payment-success.html';
    chrome.tabs.create({
      url: 'https://info.sexytofu.org/'
    });
  });
}

let paymentBtn = document.querySelector('#paymentBtn');
if (paymentBtn) {
  paymentBtn.addEventListener('click', async () => {
    //we can jump in extension pages. but open third-party page must open new tabs.
    // this.location.href = 'payment-success.html';
    chrome.tabs.create({
      url: 'https://marketplace.goldstandard.org/collections/projects'
    });
  });
}

//Normal X button
let closeBtn = document.querySelector('.close');
if (closeBtn) {
  closeBtn.addEventListener('click', async () => {
    self.close();
  });
}

//Outdated big Close button
closeBtn = document.querySelector('.CloseBtn');
if (closeBtn) {
  closeBtn.addEventListener('click', async () => {
    self.close();
  });
}

//Error page Refresh Button
let refreshBtn = document.querySelector('.refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({
      action: 'Refresh',
    })
    self.close();
  });
}