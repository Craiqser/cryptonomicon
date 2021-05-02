<script>
import { subscribeToTicker, unsubscribeFromTicker } from './api';
import TickerAdder from './components/TickerAdder.vue';
import TickerGraph from './components/TickerGraph.vue';

const PAGE_ITEMS_COUNT = 6;
const STORAGE_KEY = 'cryptonomicon-list';
const TICKETS_MAX = 15;

export default {
	name: "App",
	components: { TickerAdder, TickerGraph },

	data() {
		return {
			filter: '',
			graph: [],
			loading: false,
			page: 1,
			tickerAddingName: '',
			tickerCurrent: null,
			tickers: []
		};
	},

	computed: {
		indexEnd() {
			return this.page * PAGE_ITEMS_COUNT;
		},

		indexStart() {
			return (this.page - 1) * PAGE_ITEMS_COUNT;
		},

		pageNext() {
			return this.tickersFiltered.length > this.indexEnd;
		},

		pageState() {
			return {
				filter: this.filter,
				page: this.page
			};
		},

		tickerExists() {
			return this.tickerAddingName.length > 0
				&& this.tickers.some((ticker) => ticker.name === this.tickerAddingName.toUpperCase());
		},

		tickersFiltered() {
			return this.tickers.filter((ticker) => ticker.name.includes(this.filter));
		},

		tickersPaginated() {
			return this.tickersFiltered.slice(this.indexStart, this.indexEnd);
		},

		tooManyTickersAdded() {
			return this.tickers.length > TICKETS_MAX;
		}
	},

	watch: {
		filter() {
			this.page = 1;
		},

		pageState(value) {
			window.history.pushState(null, document.title, `${window.location.pathname}?filter=${value.filter}&page=${value.page}`);
		},

		tickerCurrent() {
			this.graph = [];
			this.$nextTick().then(this.graphElementsMaxCalculate);
		},

		tickers() {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tickers));
		},

		tickersPaginated() {
			if (this.tickersPaginated.length === 0 && this.page > 1) {
				this.page -= 1;
			}
		}
	},

	created() {
		this.loading = true;
		const VALID_KEYS = ['filter', 'page'];
		const windowData = Object.fromEntries(new URL(window.location).searchParams.entries());

		VALID_KEYS.forEach((key) => {
			if (windowData[key]) {
				this[key] = windowData[key];
			}
		});

		const tickersData = localStorage.getItem(STORAGE_KEY);
		if (tickersData) {
			this.tickers = JSON.parse(tickersData);
			this.tickers.forEach((ticker) => subscribeToTicker(ticker.name, (price) => this.tickerUpdate(ticker.name, price)));
		}
	},

	mounted() {
		this.loading = false;
	},

	methods: {
		graphResize() {
			if (this.graph.length > this.graphElementsMax) {
				this.graph = this.graph.slice(this.graph.length - this.graphElementsMax);
			}
		},

		priceFormat(price) {
			if (price === '-') {
				return price;
			}
			price = parseFloat(price);
			return price > 1 ? price.toFixed(2) : price.toPrecision(2);
		},

		tickerAdd(tickerName) {
			this.tickerAddingName = tickerName;
			if (this.tickerExists) {
				return;
			}
			const tickerToAdd = {
				name: tickerName,
				price: '-'
			};
			this.tickers = [...this.tickers, tickerToAdd];
			this.filter = '';
			this.tickerAddingName = '';
			subscribeToTicker(tickerToAdd.name, (price) => this.tickerUpdate(tickerToAdd.name, price));
		},

		tickerDelete(tickerName) {
			this.tickers = this.tickers.filter((ticker) => ticker.name !== tickerName);
			if (tickerName === this.tickerCurrent?.name) {
				this.tickerCurrent = null;
			}
			unsubscribeFromTicker(tickerName);
		},

		tickerSelect(ticker) {
			if (ticker.name === this.tickerCurrent?.name) {
				return;
			}
			this.tickerCurrent = ticker;
		},

		tickerUpdate(tickerName, price) {
			this.tickers.filter((tf) => tf.name === tickerName).forEach((ticker) => {
				ticker.price = price;
				if (ticker.name === this.tickerCurrent?.name) {
					this.graph.push(price);
					this.graphResize();
				}
			});
		}
	}
};
</script>

<template>
<div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
	<div v-if="loading" class="fixed w-100 h-100 opacity-80 bg-purple-800 inset-0 z-50 flex items-center justify-center">
		<svg class="animate-spin -ml-1 mr-3 h-12 w-12 text-white" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10"
				stroke="currentColor" stroke-width="4"
			/>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
		</svg>
	</div>
	<div class="container">
		<div class="w-full mb-4" />
		<ticker-adder :disabled="tooManyTickersAdded" @ticker-add="tickerAdd" />
		<div v-if="tickerExists" class="text-sm text-red-600">Такой тикер уже добавлен</div>
		<template v-if="tickers.length">
			<hr class="w-full border-t border-gray-600 my-4">

			<!-- Filter -->
			<div class="flex items-center my-2">
				<div>Фильтр: <input v-model="filter"></div>
				<button v-if="page > 1"
					class="mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					@click="page--"
				>
					Назад
				</button>
				<button
					v-if="pageNext"
					class="mx-2 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					@click="page++"
				>
					Вперёд
				</button>
			</div>
			<hr class="w-full border-t border-gray-600 my-4">

			<!-- Tickers info -->
			<dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
				<div
					v-for="ticker in tickersPaginated"
					:key="ticker.name"
					class="bg-white overflow-hidden shadow rounded-lg border-purple-800 border-solid cursor-pointer"
					:class="{
						'border-4': ticker === tickerCurrent,
						'bg-red-100': ticker.price === '-'
					}"
					@click="tickerSelect(ticker)"
				>
					<div class="px-4 py-5 sm:p-6 text-center">
						<dt class="text-sm font-medium text-gray-500 truncate">
							{{ ticker.name }} - USD
						</dt>
						<dd class="mt-1 text-3xl font-semibold text-gray-900">
							{{ priceFormat(ticker.price) }}
						</dd>
					</div>
					<div class="w-full border-t border-gray-200" />
					<button
						class="flex items-center justify-center font-medium w-full bg-gray-100 px-4 py-4 sm:px-6 text-md text-gray-500 hover:text-gray-600 hover:bg-gray-200 hover:opacity-20 transition-all focus:outline-none"
						@click.stop="tickerDelete(ticker.name)"
					>
						<svg class="h-5 w-5" viewBox="0 0 20 20" fill="#718096" aria-hidden="true">
							<path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
						Удалить
					</button>
				</div>
			</dl>

			<ticker-graph :graph="graph" :ticker-name="tickerCurrent" />

			<hr class="w-full border-t border-gray-600 my-4">
		</template>
	</div>
</div>
</template>
