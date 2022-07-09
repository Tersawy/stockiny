<template>
	<!-- This padding fix tr th border -->
	<div style="padding: 0 2px">
		<b-table
			:fields="fields"
			:items="details"
			show-empty
			emptyText="There are no details to show"
			class="mb-0 invoice-details-table"
			responsive
			thead-class="text-nowrap"
			tbody-class="text-nowrap"
			stacked="lg"
		>
			<template #empty="scope">
				<div class="text-center text-muted">{{ scope.emptyText }}</div>
			</template>

			<template #cell(actions)="row">
				<slot name="actions" :v-bind="row">
					<a @click="editDetail(row)" class="text-success"><EditIcon /></a>
					<a @click="removeDetail(row)" class="text-danger ml-3"><TrashIcon /></a>
				</slot>
			</template>

			<template #cell(image)="row">
				<b-avatar v-if="row.value" :src="`${BASE_URL}/images/products/${row.item.product}/${row.value}`" class="shadow-sm" rounded="lg"></b-avatar>
				<div v-else class="p-3 border rounded text-center"><GalleryIcon scale="2.5" color="#999" /></div>
			</template>

			<template #cell(name)="row">
				<div class="mb-2">
					<strong>{{ row.value }}</strong>
					<small class="text-nowrap text-muted"> ( {{ row.item.variantName }} ) </small>
				</div>

				<b-badge variant="outline-info"> {{ row.item.code }} </b-badge>
			</template>

			<template #cell(netUnitAmount)="row"> $ {{ row.item.netUnitAmount | floating }} </template>

			<template #cell(instockBySubUnit)="row">
				<b-badge :variant="row.item.stockVariant"> {{ row.value | floating }} {{ row.item.subUnitShorName }} </b-badge>
			</template>

			<template #cell(quantity)="row">
				<b-input-group style="width: 110px">
					<b-input-group-prepend>
						<b-btn :variant="row.item.decrementBtn" size="sm" class="font-default" @click="decrementQuantity(row)"> - </b-btn>
					</b-input-group-prepend>

					<b-form-input
						class="border-0 shadow-none bg-light text-center"
						v-model.number="row.item.quantity"
						@change="quantityChanged(row, $event)"
						@focus="selectTarget"
						ref="quantityInput"
					/>

					<b-input-group-append>
						<b-btn :variant="row.item.incrementBtn" size="sm" class="font-default" @click="incrementQuantity(row)"> + </b-btn>
					</b-input-group-append>
				</b-input-group>
				<input-error :namespace="namespace" :field="`details[${row.index}].quantity`" />
			</template>

			<template #cell(discountUnitAmount)="row"> $ {{ (row.item.discountUnitAmount * row.item.quantity) | floating }} </template>

			<template #cell(netUnitTax)="row"> $ {{ (row.item.netUnitTax * row.item.quantity) | floating }} </template>

			<template #cell(subtotalUnitAmount)="row">
				$ <span class="text-primary font-weight-600"> {{ row.item.subtotalUnitAmount | floating }} </span>
			</template>
		</b-table>
	</div>
</template>

<script>
import EditIcon from "@/components/icons/edit";

import TrashIcon from "@/components/icons/trash";

import GalleryIcon from "@/components/icons/gallery";

import InputError from "@/components/InputError.vue";

export default {
	props: {
		details: { type: Array },

		fields: { type: Array },

		namespace: { type: String }
	},

	components: { EditIcon, TrashIcon, GalleryIcon, InputError },

	methods: {
		editDetail(row) {
			this.$emit("editDetail", row.item);
		},

		removeDetail(row) {
			this.$emit("removeDetail", row.index);
		},

		quantityChanged(row, $event) {
			this.$emit("quantityChanged", row, $event);
		},

		decrementQuantity(row) {
			this.$emit("decrementQuantity", row);
		},

		incrementQuantity(row) {
			this.$emit("incrementQuantity", row);
		},

		selectTarget(e) {
			e.currentTarget && e.currentTarget?.select();
		}
	}
};
</script>

<style lang="scss">
.invoice-details-table {
	thead {
		border: 1px solid #dee2e6;
		th {
			border-top: 0;
			border: 0;
			color: var(--gray);
			font-size: 0.75rem;
			padding-left: 1rem;
			border-right: 1px solid #dee2e6;
		}
	}
	tbody {
		tr:first-child {
			td {
				border-top: 0;
			}
		}
	}
	.table.b-table.b-table-stacked-lg > tbody > tr {
		@media (max-width: 991.98px) {
			& > td {
				display: flex;
			}
			& > [data-label]::before {
				float: none;
				text-align: left;
				margin-top: auto;
				margin-bottom: auto;
				width: 35%;
			}
			& > [data-label]::after {
				display: none;
			}
		}
		@media (min-width: 650.98px) and (max-width: 991.98px) {
			& > [data-label]::before {
				margin-left: 30%;
			}
		}
		@media (max-width: 650.98px) {
			& > [data-label]::before {
				width: 40%;
			}
		}
	}
}
</style>
