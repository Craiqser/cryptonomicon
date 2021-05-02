<script>
import ButtonAdd from './ButtonAdd.vue';

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
		return { tickerName: '' };
	},

	methods: {
		tickerAdd() {
			if (this.tickerName.length === 0) {
				return;
			}
			this.$emit('ticker-add', this.tickerName);
			this.tickerName = '';
		}
	}
};
</script>

<template>
<section>
	<div class="flex">
		<div class="max-w-xs mr-2">
			<label for="wallet" class="block text-sm font-medium text-gray-700">Тикер</label>
			<div class="flex mt-1 relative rounded-md shadow-md">
				<input
					id="wallet"
					v-model.trim="tickerName"
					type="text"
					name="wallet"
					placeholder="Например, DOGE"
					class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
					@keydown.enter="tickerAdd"
				>
			</div>
		</div>
	</div>
	<button-add
		class="m-2"
		type="button"
		:disabled="disabled"
		@click="tickerAdd"
	/>
</section>
</template>
