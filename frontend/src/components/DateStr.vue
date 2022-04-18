<template>
	<div>
		<template v-if="isValid">
			<div v-if="full"> {{ fullDate }} </div>
			<div v-else v-b-tooltip.hover :title="fullDate">{{ getDate }}</div>
		</template>
		<div v-else> {{ invalidText }} </div>
	</div>
</template>

<script>
export default {
	props: {
		date: { type: String, required: true },
		full: { type: Boolean, default: false },
		invalidText: { type: String, default: "- - -" }
	},

	computed: {
		isValid() {
			return !!this.date && new Date(this.date) !== "Invalid Date";
		},

		dateObj() {
			return new Date(this.date);
		},

		getDate() {
			if (!this.isValid) return this.invalidText;

			return this.full ? this.fullDate : this.simpleDate;
		},

		fullDate() {
			return this.dateObj.toLocaleString();
		},

		simpleDate() {
			return this.day + "-" + this.month + "-" + this.year;
		},

		year() {
			return this.dateObj.getFullYear();
		},

		month() {
			let month = this.dateObj.getMonth() + 1;

			return month < 10 ? `0${month}` : month;
		},

		day() {
			let day = this.dateObj.getDate();

			return day < 10 ? `0${day}` : day;
		}
	}
};
</script>