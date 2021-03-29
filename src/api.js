const API_KEY = '164afab32fd8a2e783c90b333887eaaaea9a8c146437141ead69c62edbf4dd5e';

const AGGREGATE_INDEX = '5';
const INVALID_SUB_MESSAGE = 'INVALID_SUB';
const TYPE_ERROR = '500';
const URL_BASE_API = 'https://min-api.cryptocompare.com/data';
const URL_BASE_WS = 'wss://streamer.cryptocompare.com/v2';
const URL_PARAM_COINLIST = '/all/coinlist?summary=true';

const RATE_FSYM = 'BTC';
const RATE_TSYM = 'USD';

const soket = new WebSocket(`${URL_BASE_WS}?api_key=${API_KEY}`);
const tickersHandlers = new Map();

let coins = null;
let crossRate = 0.0;

soket.addEventListener('message', event => {
	const {
		TYPE: type,
		MESSAGE: message,
		PARAMETER: parameter,
		FROMSYMBOL: fsym,
		TOSYMBOL: tsym,
		PRICE: price
	} = JSON.parse(event.data);

	if (type === TYPE_ERROR) {
		if (message === INVALID_SUB_MESSAGE) {
			reSubscribe(parameter);
		}
	}

	if ((type === AGGREGATE_INDEX) && (price !== undefined)) {
		let priceNew = price;

		if (tsym && tsym === RATE_FSYM && crossRate) {
			priceNew *= crossRate;
		}

		const callbacks = tickersHandlers.get(fsym) || [];
		callbacks.forEach(callback => callback(priceNew));
	}
});

function reSubscribe(parameter) {
	const parms = parameter.split('~');

	if (parms.length > 2) {
		const fsym = parms[2];
		const tsym = parms[3];
		unsubscribeFromTickerOnWS(fsym, tsym);

		if ((tsym === RATE_TSYM) && (fsym !== RATE_FSYM)) {
			subscribeToTickerOnWS(fsym, RATE_FSYM);
		}
	}
}

function sendToWebSocket(message) {
	const messageStringified = JSON.stringify(message);

	if (soket.readyState == WebSocket.OPEN) {
		soket.send(messageStringified);
		return;
	}

	soket.addEventListener('open', () => soket.send(messageStringified), { once: true });
}

function subscribeToTickerOnWS(fsym, tsym = RATE_TSYM) {
	sendToWebSocket({
		"action": "SubAdd",
		"subs": [`${AGGREGATE_INDEX}~CCCAGG~${fsym}~${tsym}`]
	});
}

function unsubscribeFromTickerOnWS(fsym, tsym = RATE_TSYM) {
	sendToWebSocket({
		"action": "SubRemove",
		"subs": [`${AGGREGATE_INDEX}~CCCAGG~${fsym}~${tsym}`]
	});
}

export const coinsGet = async () => {
	if (!coins) {
		const coinsArray = await fetch(`${URL_BASE_API}${URL_PARAM_COINLIST}`)
			.then(res => res.json())
			.then(data => Object.entries(data.Data).map(item => [item[0], item[1].FullName]));

		coins = new Map(coinsArray);
	}

	return coins;
}

export const subscribeToTicker = (tickerName, callback) => {
	const callbacks = tickersHandlers.get(tickerName) || [];
	tickersHandlers.set(tickerName, [...callbacks, callback]);

	if (!callbacks.length) {
		subscribeToTickerOnWS(tickerName);
	}
}

export const unsubscribeFromTicker = tickerName => {
	if (tickerName === RATE_FSYM) {
		const callbacks = tickersHandlers.get(tickerName) || [];

		if (callbacks.length > 1) {
			tickersHandlers.set(tickerName, [callbacks[0]]);
		}
	}
	else {
		tickersHandlers.delete(tickerName);
		unsubscribeFromTickerOnWS(tickerName);
	}
}

subscribeToTicker(RATE_FSYM, price => crossRate = price);
