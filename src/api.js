const API_KEY = '164afab32fd8a2e783c90b333887eaaaea9a8c146437141ead69c62edbf4dd5e';

// TODO: refactor to use URLSearchParams
export const loadTickers = tickers =>
	fetch(
		`https://min-api.cryptocompare.com/data/price?fsym=USD&tsyms=${tickers.join(',')}&api_key=${API_KEY}`
	)
	.then(r => r.json())
	.then(rawData => Object.fromEntries(
		Object.entries(rawData).map((key, value) => [key, 1 / value])
	));
