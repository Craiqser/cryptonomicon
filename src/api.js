const API_KEY = '164afab32fd8a2e783c90b333887eaaaea9a8c146437141ead69c62edbf4dd5e';
const URL_BASE_API = 'https://min-api.cryptocompare.com/data';
const URL_BASE_WS = 'wss://streamer.cryptocompare.com/v2';
const AGGREGATE_INDEX = "5";

const tickersHandlers = new Map();
const soket = new WebSocket(`${URL_BASE_WS}?api_key=${API_KEY}`);

soket.addEventListener('message', event => {
	// console.log(event);
	const { TYPE: type, FROMSYMBOL: tickerName, PRICE: price } = JSON.parse(event.data);

	if (type !== AGGREGATE_INDEX || price === undefined) {
		return;
	}

	const callbacks = tickersHandlers.get(tickerName) || [];
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

function subscribeToTickerOnWS(tickerName) {
	sendToWebSocket({
		"action": "SubAdd",
		"subs": [`5~CCCAGG~${tickerName}~USD`]
	});
}

function unsubscribeFromTickerOnWS(tickerName) {
	sendToWebSocket({
		"action": "SubRemove",
		"subs": [`5~CCCAGG~${tickerName}~USD`]
	});
}

export const subscribeToTicker = (tickerName, callback) => {
	const callbacks = tickersHandlers.get(tickerName) || [];
	tickersHandlers.set(tickerName, [...callbacks, callback]);
	subscribeToTickerOnWS(tickerName);
}

export const unsubscribeFromTicker = tickerName => {
	tickersHandlers.delete(tickerName);
	unsubscribeFromTickerOnWS(tickerName);
}
