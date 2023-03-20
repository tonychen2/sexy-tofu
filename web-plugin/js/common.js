const GHGI_API_ADDRESS = 'https://api.sexytofu.org/api.ghgi.org:443';
const GHGI_CONFIDENCE_LIMIT = 0.2; //need try found a reasonable limit. 0.5 will ignore too much, like organic banana.
const G_TO_POUND = 0.00220462262185;
const CarbonCostFeeRate = 0.000050; //  $50 per 1000 kg, as per  0.000050 /per g.
let IS_Debuger = true;
const ZERO = 0.0000001;
const MIN_COST = 0.01;
const Expire_Period = 24 * 60 * 60 * 1000;
const OutDatedColor = '#FABB05';
const DefaultColor = '#4285F4';
const DefaultTextColor = '#FFFFFF';

const STATUS = {
    Empty: 'empty',
    HaveFood: 'offset',
    ERROR: 'error'
}

//convert table for like  "ct -> ounce". many convert GHGI support it.
const UNIT_Convert = {
    //"lb" : "pound", // found this valid short can auto convert by the API.
    //"oz" : "ounce",
    "ct": "oz",
    "fl oz": "oz",
    "oz bunch": "oz"
}

const UNIT_RemoveWords = [
    " container", //should have before space...
    " bag", 
    "about ",
    " package",
    "count "
]

