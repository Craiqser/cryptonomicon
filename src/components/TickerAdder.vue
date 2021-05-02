<script>
import ButtonAdd from './ButtonAdd.vue';
import { coinsGet } from '../api.js';

const SUGGESTIONS = 4;

export default {
	components: {
		ButtonAdd
	},

	props: {
		disabled: {
			default: false,
			required: false,
			type: Boolean
		}
	},

	emits: {
		'ticker-add': (value) => typeof value === 'string' && value.length > 0
	},

	data() {
		return {
			coinList: [],
			tickerName: ''
		};
	},

	computed: {
		tickersSuggestion() {
			let ret = [];

			if (this.tickerName.length > 0) {
				ret = this.coinList
					.filter(([_, v]) => v.includes(this.tickerName.toUpperCase()))
					.map(([k, _]) => k)
					.slice(0, SUGGESTIONS);
			}

			return ret;
		}
	},

	created() {
		this.coinListFetch();
	},

	methods: {
		async coinListFetch() {
			this.coinList = await coinsGet();
		},

		suggestionHandler(tickerName) {
			this.tickerName = tickerName;
			this.tickerAdd();
		},

		tickerAdd() {
			if (this.tickerName.length === 0) {
				return;
			}
			this.$emit('ticker-add', this.tickerName.toUpperCase());
			this.tickerName = '';
		}
	}
};
</script>

<template>
<section>
	<div class="flex">
		<label for="wallet" class="block mr-2 text-sm font-medium text-gray-700">Тикер</label>
		<div class="flex rounded-md shadow-md">
			<input id="wallet" v-model.trim="tickerName" type="text" name="wallet"
				placeholder="Например, DOGE"
				class="block w-full pr-2 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
				@keydown.enter="tickerAdd"
			>
		</div>
	</div>
	<div v-if="tickersSuggestion.length > 0" class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap">
		<template v-for="item in tickersSuggestion" :key="item">
			<span
				class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
				@click="suggestionHandler(item)"
			>
				{{ item }}
			</span>
		</template>
	</div>
	<button-add class="m-2" type="button" :disabled="disabled" @click="tickerAdd" />
</section>
</template>
