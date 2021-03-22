const API_KEY = '164afab32fd8a2e783c90b333887eaaaea9a8c146437141ead69c62edbf4dd5e';
const tickersHandlers = new Map();

// TODO: refactor to use URLSearchParams
const loadExchangeRates = () => {
	if (tickersHandlers.size === 0) {
		return;
	}

	fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD&api_key=${API_KEY}`)
		.then(res => res.json())
		.then(rawData => {
			const exchangeRates = Object.fromEntries(Object.entries(rawData).map((key, value) => [key, 1 / value.USD]));
			Object.entries(exchangeRates).forEach(([currency, price]) => {
				const callbacks = tickersHandlers.get(currency) ?? [];
				callbacks.forEach(callback => callback(price));
			});
		});
}

export const subscribeToTicker = (tickerName, callback) => {
	const callbacks = tickersHandlers.get(tickerName) || [];
	tickersHandlers.set(tickerName, [...callbacks, callback]);
}

export const unsubscribeFromTicker = (tickerName, callback) => {
	const callbacks = tickersHandlers.get(tickerName) || [];
	tickersHandlers.set(tickerName, callbacks.filter(cb => cb !== callback));
}

setInterval(loadExchangeRates, 5000);
