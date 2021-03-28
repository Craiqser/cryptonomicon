const AGGREGATE_INDEX = '5';
const API_KEY = '164afab32fd8a2e783c90b333887eaaaea9a8c146437141ead69c62edbf4dd5e';

const RATE_FSYM = 'BTC';
const RATE_TSYM = 'USD';

const URL_BASE_API = 'https://min-api.cryptocompare.com/data';
const URL_BASE_WS = 'wss://streamer.cryptocompare.com/v2';

const soket = new WebSocket(`${URL_BASE_WS}?api_key=${API_KEY}`);
const tickersHandlers = new Map();

let crossRate = 0.0;

soket.addEventListener('message', event => {
	// console.log(event.data);
	const { TYPE: type, FROMSYMBOL: fsym, PRICE: price } = JSON.parse(event.data);

	if (type !== AGGREGATE_INDEX || price === undefined) {
		return;
	}

	const callbacks = tickersHandlers.get(fsym) || [];
	callbacks.forEach(callback => callback(price));
});

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
