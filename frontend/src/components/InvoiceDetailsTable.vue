<template>
	<!-- This padding fix tr th border -->
	<div style="padding: 0 2px">
		<b-table
			:fields="fields"
			:items="invoice.details"
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
				<a @click="detail = { ...row.item }" class="text-success" v-b-modal.productDetailModal><EditIcon /></a>
				<a @click="removeProduct(row)" class="text-danger ml-3"><TrashIcon /></a>
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

			<template #cell(instock)="row">
				<b-badge :variant="row.item.stockVariant"> {{ row.value | floating }} {{ subUnit(row.item).shortName }} </b-badge>
			</template>

			<template #cell(quantity)="row">
				<b-input-group style="width: 110px">
					<b-input-group-prepend>
						<b-btn :variant="row.item.decrementBtn" size="sm" class="font-default" @click="decrementQuantity(row)"> - </b-btn>
					</b-input-group-prepend>

					<b-form-input class="border-0 shadow-none bg-light text-center" v-model.number="row.item.quantity" @change="quantityChanged(row)" @focus="selectTarget" />

					<b-input-group-append>
						<b-btn :variant="row.item.incrementBtn" size="sm" class="font-default" @click="incrementQuantity(row)"> + </b-btn>
					</b-input-group-append>
				</b-input-group>
			</template>

			<template #cell(discountUnitAmount)="row"> $ {{ row.item.discountUnitAmount | floating }} </template>

			<template #cell(netUnitTax)="row"> $ {{ (row.item.netUnitTax * row.item.quantity) | floating }} </template>

			<template #cell(subtotalUnitAmount)="row">
				$ <span class="text-primary font-weight-600"> {{ row.item.subtotalUnitAmount | floating }} </span>
			</template>
		</b-table>

		<InvoiceDetailForm
			:unitLabel="unitLabel"
			:namespace="namespace"
			:amountType="amountType"
			:detail="detail"
			@done="updateDetail"
			@reset-modal="() => (detail = null)"
		/>
	</div>
</template>

<script>
import InvoiceDetailForm from "@/components/InvoiceDetailForm";

import EditIcon from "@/components/icons/edit";

import TrashIcon from "@/components/icons/trash";

import GalleryIcon from "@/components/icons/gallery";

export default {
	props: {
		invoice: { type: Object },

		amountType: { type: String },

		namespace: { type: String },

		checkQuantity: { type: Boolean },

		productOptions: { type: Array },

		unitLabel: { type: String }
	},

	components: { InvoiceDetailForm, EditIcon, TrashIcon, GalleryIcon },

	data() {
		return {
			detail: null,

			fields: [
				{ key: "image", label: "Image" },
				{ key: "name", label: "Name" },
				{ key: "netUnitAmount", label: `Net Unit ${this.amountType}` },
				{ key: "instock", label: "Instock" },
				{ key: "quantity", label: "Quantity" },
				{ key: "discountUnitAmount", label: "Discount" },
				{ key: "netUnitTax", label: "Tax" },
				{ key: "subtotalUnitAmount", label: `Subtotal ${this.amountType}` },
				{ key: "actions", label: "Actions" }
			]
		};
	},

	watch: {
		//? this updates product cost or price in productDetailForm when subUnit changed
		"detail.subUnit": {
			// ? check if last value not null this because when open the productDetailForm last value already null
			handler(newValue, oldValue) {
				//? This subUnit has been changed so we need to reset product amount input in productDetailForm
				if (oldValue && newValue) {
					let productOption = this.productOptions.find((opt) => opt.product == this.detail.product);

					this.detail.amount = productOption.amount;

					this.detail.subUnitAmount = this.subUnitAmount(this.detail);
				}
			},
			deep: true
		},
		"detail.subUnitAmount": {
			handler(value) {
				if (value) {
					//? this mean the product amount input from productDetailForm will effect directly in detail amount
					if (this.detail.subUnit == this.detail.unit) {
						this.detail.amount = +value;
					} else {
						let unit = this.subUnit(this.detail);

						let isMultiple = unit.operator === "*";

						this.detail.amount = !isMultiple ? +value * +unit.value : +value / +unit.value;
					}
				}
			},
			deep: true
		}
	},

	methods: {
		updateDetail(detail) {
			this.invoice.details = this.invoice.details.map((oldDetail) => {
				if (oldDetail.product == detail.product && oldDetail.variantId == detail.variantId) {
					oldDetail = this.net(detail);
					for (let key in detail) {
						oldDetail[key] = detail[key];
					}
				}
				return oldDetail;
			});
		},

		addDetail(product) {
			if (!this.invoice.warehouse && !this.invoice.fromWarehouse) return alert("Please choose the warehouse first");

			if (typeof product.quantity === "undefined") {
				product.quantity = this.instock(product) < 1 && product.stock > 0 ? this.instock(product) : 1;
			}

			let detail = this.net(product);

			detail.decrementBtn = "primary";
			detail.incrementBtn = "primary";
			detail.stockVariant = "outline-success";

			this.invoice.details.push(detail);
		},

		mainUnit(product) {
			return this.$store.state.Units.options.find((unit) => product.unit == unit._id);
		},

		subUnit(product) {
			let mainUnit = this.mainUnit(product);

			let subUnit = mainUnit.subUnits.find((unit) => unit._id == product.subUnit);

			return subUnit;
		},

		subUnitAmount(product) {
			let unit = this.subUnit(product);

			// this amount depended on main unit and it is come from api;
			let amount = +product.amount;

			let isMultiple = unit.operator === "*";

			let subUnitAmount = isMultiple ? +amount * +unit.value : +amount / +unit.value;

			return +subUnitAmount;
		},

		discountUnitAmount(product) {
			let isFixed = product.discountMethod == "fixed";

			product.discount = +product.discount || 0;

			if (isFixed) return product.discount;

			let subUnitAmount = this.subUnitAmount(product);

			return product.discount * (subUnitAmount / 100);
		},

		netUnitAmount(product) {
			let amountExcludingDiscount = this.subUnitAmount(product) - this.discountUnitAmount(product);

			let isExclusive = product.taxMethod == "exclusive";

			if (isExclusive) return amountExcludingDiscount;

			product.tax = +product.tax || 0;

			let taxDivide = 1 + product.tax / 100;

			return amountExcludingDiscount / taxDivide;
		},

		netUnitTax(product) {
			let amountExcludingDiscount = this.subUnitAmount(product) - this.discountUnitAmount(product);

			let isExclusive = product.taxMethod == "exclusive";

			if (isExclusive) {
				return (+product.tax || 0) * (amountExcludingDiscount / 100);
			}

			return amountExcludingDiscount - this.netUnitAmount(product);
		},

		totalUnitAmount(product) {
			return this.netUnitAmount(product) + this.netUnitTax(product);
		},

		subtotalUnitAmount(product) {
			return this.totalUnitAmount(product) * product.quantity;
		},

		instock(product) {
			// this stock depended on main unit and it is come from api;
			let instock = +product.stock;

			if (!instock) return 0;

			let subUnit = this.subUnit(product);

			//? reverse operator if sub unit is not main unit to get right stock value
			let isMultiple = subUnit.operator === "*" && subUnit._id == product.unit;

			instock = isMultiple ? instock * +subUnit.value : instock / +subUnit.value;

			return instock;
		},

		net(product) {
			product.subUnitAmount = this.subUnitAmount(product);
			product.netUnitAmount = this.netUnitAmount(product);
			product.netUnitTax = this.netUnitTax(product);
			product.discountUnitAmount = this.discountUnitAmount(product);
			product.totalUnitAmount = this.totalUnitAmount(product);
			product.subtotalUnitAmount = this.subtotalUnitAmount(product);
			product.instock = this.instock(product);

			return product;
		},

		incrementQuantity(row) {
			if (/^\d+$|^\d+\.\d+$|^\.\d+$/.test(row.item.quantity)) {
				if (this.checkQuantity) {
					if (row.item.quantity >= row.item.instock) {
						if (row.item.timeout) clearTimeout(row.item.timeout);
						row.item.stockVariant = "outline-danger";
						row.item.incrementBtn = "danger";
						row.item.timeout = setTimeout(() => {
							row.item.stockVariant = "outline-success";
							row.item.incrementBtn = "primary";
							this.updateDetail(row.item);
						}, 300);
					} else if (row.item.quantity + 1 > row.item.instock) {
						row.item.quantity = row.item.instock;
						row.value = row.item.instock;
					} else {
						row.item.quantity += 1;
						row.value += 1;
					}
				} else {
					row.item.quantity += 1;
					row.value += 1;
				}
			} else {
				row.item.quantity = row.item.instock || 1;
				row.value = row.item.instock || 1;
			}

			this.updateDetail(row.item);
		},

		decrementQuantity(row) {
			if (/^\d+$|^\d+\.\d+$|^\.\d+$/.test(row.item.quantity) && row.item.quantity - 1 > 0) {
				row.item.quantity -= 1;
				row.value -= 1;
			} else {
				if (row.item.quantity == 1 || row.item.quantity == row.item.instock) {
					if (row.item.timeout) clearTimeout(row.item.timeout);

					row.item.decrementBtn = "danger";

					row.item.timeout = setTimeout(() => {
						row.item.decrementBtn = "primary";

						this.updateDetail(row.item);
					}, 300);
				} else {
					row.item.quantity = row.item.instock || 1;
					row.value = row.item.instock || 1;
				}
			}

			this.updateDetail(row.item);
		},

		quantityChanged(row) {
			let regex = /^\d+$|^\d+\.\d+$|^\.\d+$/;

			let isValid = regex.test(row.item.quantity);

			if (!isValid || (this.checkQuantity && row.item.instock < row.item.quantity)) {
				row.item.quantity = row.item.instock || 1;
			}

			this.updateDetail(row.item);
		},

		removeProduct(row) {
			this.invoice.details = this.invoice.details.filter((_p, i) => i != row.index);
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
