<template>
	<main-content :breads="breads">
		<template #end-breads>
			<div class="d-flex align-items-center">
				<!-- Save Button -->
				<b-overlay :show="isBusy" opacity="0.6" spinner-small spinner-variant="primary">
					<b-button variant="outline-primary" size="sm" :disabled="isBusy" @click="handleSave"> Save </b-button>
				</b-overlay>
				<!-- Cancel Button -->
				<b-button variant="outline-danger" size="sm" @click="handleCancel" class="ml-2"> Cancel </b-button>
			</div>
		</template>
		<b-row>
			<b-col cols="12" lg="8">
				<b-card header="Product Details">
					<b-form @submit.prevent="handleSave">
						<b-row cols="1" cols-md="2" align-h="center">
							<!-- Name Input -->
							<b-col>
								<default-input ref="inputName" label="Name" placeholder="Enter Product Name" field="name" :vuelidate="$v.product" namespace="Products" />
							</b-col>

							<!-- Category Input -->
							<b-col>
								<default-select label="Category" field="category" :options="categoriesOptions" :vuelidate="$v.product" namespace="Products" />
							</b-col>

							<!-- Brand Input -->
							<b-col>
								<default-select label="Brand" field="brand" :options="brandsOptions" :vuelidate="$v.product" namespace="Products" />
							</b-col>

							<!-- Barcode Type Input -->
							<b-col>
								<default-select label="Barcode Type" field="barcodeType" :options="barcodeOptions" :vuelidate="$v.product" namespace="Products" @change="generateCode" />
							</b-col>

							<!-- Product Code Input -->
							<b-col>
								<default-input label="Product Code" placeholder="Enter Product Code" field="code" :vuelidate="$v.product" namespace="Products" type="number">
									<b-input-group-prepend is-text class="mr-0 c-pointer" @click="generateCode">
										<BarcodeIcon />
									</b-input-group-prepend>
								</default-input>
							</b-col>

							<!-- Product Price Input -->
							<b-col>
								<default-input label="Product Price" placeholder="Enter Product Price" field="price" :vuelidate="$v.product" namespace="Products" type="number" />
							</b-col>

							<!-- Product Cost Input -->
							<b-col>
								<default-input label="Product Cost" placeholder="Enter Product Cost" field="cost" :vuelidate="$v.product" namespace="Products" type="number" />
							</b-col>

							<!-- Product Order Tax Input -->
							<b-col>
								<tax-input field="tax" :vuelidate="$v.product" namespace="Products" />
								<!-- <default-input label="Product Order Tax" placeholder="Enter Order Tax" field="tax" :vuelidate="$v.product" namespace="Products" type="number">
									<b-input-group-prepend is-text class="mr-0">%</b-input-group-prepend>

									<b-input-group-prepend class="mr-0 c-pointer">
										<b-dropdown :text="taxMethodText" toggle-class="tax-method-toggler" right>
											<b-dropdown-item
												v-for="opt in taxMethodOptions"
												:key="opt._id"
												@click="product.taxMethod = opt._id"
												:link-class="{ active: product.taxMethod == opt._id }"
											>
												{{ opt.name }}
											</b-dropdown-item>
										</b-dropdown>
									</b-input-group-prepend>
								</default-input> -->
							</b-col>

							<!-- Product Minimum Alert Input -->
							<b-col>
								<default-input label="Stock Minimum Alert" field="minimumStock" :vuelidate="$v.product" namespace="Products" type="number" />
							</b-col>

							<!-- Product Unit Input -->
							<b-col>
								<default-select label="Product Unit" field="unit" :options="unitsOptions" :vuelidate="$v.product" namespace="Products" />
							</b-col>

							<!-- Purchase Unit Input -->
							<b-col>
								<default-select label="Purchase Unit" field="purchaseUnit" :options="purchaseUnitsOptions" :vuelidate="$v.product" namespace="Products" />
							</b-col>

							<!-- Sale Unit Input -->
							<b-col>
								<default-select label="Sale Unit" field="saleUnit" :options="saleUnitsOptions" :vuelidate="$v.product" namespace="Products" />
							</b-col>

							<!-- Product Notes Input -->
							<b-col cols="12" md="12" lg="12">
								<default-text-area class="mb-0" label="Notes" placeholder="Enter Product Notes" field="notes" :vuelidate="$v.product" namespace="Products" />
							</b-col>
						</b-row>
					</b-form>
				</b-card>
			</b-col>

			<b-col cols="12" lg="4" class="mt-4 mt-lg-0">
				<b-row cols="1">
					<!-- Product Images -->
					<b-col v-if="!isUpdate">
						<b-card header="Product Images">
							<ImageUploader :max="10" v-model="product.images" :beforeUpload="beforeUploadImage" multiple />

							<input-error class="text-center mt-1" field="images" namespace="Products" :vuelidateField="$v.product.images" />
						</b-card>
					</b-col>

					<!-- Product Controls -->
					<b-col :class="{ 'mt-4': !isUpdate }">
						<b-card header="Product Controls">
							<b-row cols="1" cols-md="2" cols-lg="1">
								<b-col>
									<b-form-checkbox v-model="product.availableForSale" switch class="mx-3 mb-3 mb-md-0 mb-lg-3 text-nowrap"> Is Available For Sale ? </b-form-checkbox>
								</b-col>
								<b-col>
									<b-form-checkbox v-model="product.availableForPurchase" switch class="mx-3 text-nowrap"> Is Available For Purchase ? </b-form-checkbox>
								</b-col>
							</b-row>
						</b-card>
					</b-col>

					<!-- Product Variants -->
					<b-col class="mt-4" v-if="!isUpdate">
						<b-card header="Product Variants">
							<b-form-group label="Variants" label-for="productVariants">
								<b-form-tags
									input-id="productVariants"
									v-model="product.variants"
									placeholder="Enter Product Variants"
									add-button-variant="outline-primary"
									add-button-text="Add"
									tag-variant="primary"
									:tag-validator="tagValidator"
									remove-on-delete
								></b-form-tags>

								<template #description> Variant must be 3 to 54 characters in length. </template>
							</b-form-group>
						</b-card>
					</b-col>
				</b-row>
			</b-col>
		</b-row>
	</main-content>
</template>

<script>
import { mapActions, mapMutations, mapState } from "vuex";

import { required, minLength, maxLength, minValue, maxValue, numeric } from "vuelidate/lib/validators";

import { validationMixin } from "vuelidate";

import BarcodeIcon from "@/components/icons/barcode";

const TaxInput = () => import("../../components/inputs/TaxInput");

const ImageUploader = () => import("@/components/inputs/ImageUploader/index");

const InputError = () => import("@/components/InputError");

const DefaultInput = () => import("@/components/inputs/DefaultInput");

const DefaultSelect = () => import("@/components/inputs/DefaultSelect");

const DefaultTextArea = () => import("@/components/inputs/DefaultTextArea");

export default {
	components: { DefaultInput, DefaultSelect, DefaultTextArea, ImageUploader, InputError, BarcodeIcon, TaxInput },

	mixins: [validationMixin],

	data() {
		let isEdit = this.$route.params.productId;

		return {
			breads: [{ title: "Dashboard", link: "/" }, { title: "Products", link: "/products" }, { title: isEdit ? "Edit" : "Create" }],

			product: {
				name: null,
				barcodeType: "CODE128",
				code: null,
				price: null,
				cost: null,
				minimumStock: 0,
				tax: 0,
				taxMethod: "exclusive",
				category: null,
				brand: null,
				unit: null,
				purchaseUnit: null,
				saleUnit: null,
				images: [],
				availableForSale: true,
				availableForPurchase: true,
				variants: [],
				note: null
			},

			barcodeOptions: [
				{ name: "Choose Symbology", _id: null, disabled: true },
				{ name: "Code 128", _id: "CODE128", codeLength: 8, disabled: false },
				{ name: "Code 39", _id: "CODE39", codeLength: 8, disabled: false },
				{ name: "EAN8", _id: "EAN8", codeLength: 7, disabled: false },
				{ name: "EAN13", _id: "EAN13", codeLength: 12, disabled: false },
				{ name: "UPC", _id: "UPC", codeLength: 11, disabled: false }
			],

			taxMethodOptions: [
				{ name: "Inclusive", _id: "inclusive", disabled: false },
				{ name: "Exclusive", _id: "exclusive", disabled: false }
			],

			isBusy: false
		};
	},

	validations: {
		product: {
			name: { required, minLength: minLength(3), maxLength: maxLength(54) },
			barcodeType: { required, minLength: minLength(3), maxLength: maxLength(20) },
			code: { required, minLength: minLength(3), maxLength: maxLength(20) },
			price: { required, minValue: minValue(1), numeric },
			cost: { required, minValue: minValue(1), numeric },
			minimumStock: { required, numeric, minValue: minValue(0) },
			tax: { required, numeric, minValue: minValue(0), maxValue: maxValue(100) },
			taxMethod: { required },
			category: { required },
			brand: { required },
			unit: { required },
			purchaseUnit: { required },
			saleUnit: { required },
			images: {},
			notes: { maxlength: maxLength(255) }
		}
	},

	async mounted() {
		this.generateCode();
		this.getCategoriesOptions();
		this.getBrandsOptions();
		this.getUnitsOptions();

		if (this.isUpdate) {
			await this.getProduct(this.$route.params.productId);

			this.product = { ...this.oldProduct };
		}
	},

	watch: {
		"product.unit": {
			handler(newValue, oldValue) {
				// This Check is fix add the first value in edit form
				if (oldValue) {
					this.product.purchaseUnit = null;
					this.product.saleUnit = null;
				}
			},
			deep: true
		}
	},

	computed: {
		...mapState({
			categoriesOptions: (state) => state.Categories.options,
			brandsOptions: (state) => state.Brands.options,
			unitsOptions: (state) => state.Units.options,
			oldProduct: (state) => state.Products.one
		}),

		subUnitOptions() {
			return this.$store.getters["Units/subUnitOptions"](this.product.unit);
		},

		purchaseUnitsOptions() {
			return [{ name: "Choose Purchase Unit", _id: null, disabled: true }, ...this.subUnitOptions];
		},

		saleUnitsOptions() {
			return [{ name: "Choose Sale Unit", _id: null, disabled: true }, ...this.subUnitOptions];
		},

		isUpdate() {
			return !!this.$route.params.productId;
		},

		taxMethodText() {
			return this.product.taxMethod === "inclusive" ? "Inclusive" : "Exclusive";
		}
	},

	methods: {
		...mapActions({
			create: "Products/create",
			update: "Products/update",
			getCategoriesOptions: "Categories/getOptions",
			getBrandsOptions: "Brands/getOptions",
			getUnitsOptions: "Units/getOptions",
			getProduct: "Products/getEdit"
		}),

		...mapMutations("Products", ["resetErrorByField", "setError", "resetError", "setOne"]),

		tagValidator(tag) {
			// Individual tag validator function
			return tag.length >= 3 && tag.length <= 54;
		},

		generateCode() {
			this.product.barcodeType = this.product.barcodeType || this.barcodeOptions[1]._id;

			let opt = this.barcodeOptions.find((opt) => opt._id == this.product.barcodeType);

			let length = opt.codeLength;

			let code = this.randomInteger(length);

			// Calculate the checksum digit
			// https://en.wikipedia.org/wiki/International_Article_Number_(EAN)#Calculation_of_checksum_digit
			if (opt._id == "EAN13") {
				code = `${code}${this.ean13GetDigit(code)}`;
			} else if (["EAN8", "UPC"].includes(opt._id)) {
				code = `${code}${this.ean8GetDigit(code)}`;
			}

			this.product.code = code.toString();
		},

		ean13GetDigit(code) {
			let sum = code.toString().split("").reduce(this.ean13Sum, 0);

			return (10 - (sum % 10)) % 10;
		},

		ean8GetDigit(code) {
			let sum = code.toString().split("").reduce(this.ean8Sum, 0);

			return (10 - (sum % 10)) % 10;
		},

		ean8Sum(total, digit, index) {
			return index % 2 ? +total + +digit : +total + +digit * 3;
		},

		ean13Sum(total, digit, index) {
			return index % 2 ? +total + +digit * 3 : +total + +digit;
		},

		randomInteger(length) {
			let min = 10 ** (length - 1),
				max = 10 ** length - 1;

			return Math.floor(Math.random() * (max - min)) + min;
		},

		beforeUploadImage(err) {
			if (err) {
				this.setError({ field: "images", message: err });
			} else {
				this.resetErrorByField("images");
			}
		},

		async handleSave() {
			this.$v.$touch();

			if (this.$v.product.$invalid) return;

			this.isBusy = true;

			let data = { ...this.product };

			if (this.product.images && this.product.images.length) {
				data = new FormData();

				for (let key in this.product) {
					if (Array.isArray(this.product[key])) {
						this.product[key].forEach((item) => data.append(key, item));
					} else {
						data.set(key, this.product[key]);
					}
				}

				data = [data, { headers: { "Content-Type": "multipart/formdata" } }];
			}

			let action = this.isUpdate ? this.update : this.create;

			try {
				let res = await action(data);

				let message = "actions.created";

				if (res.status == 200) {
					message = "actions.updated";
				}

				message = this.$t(message, { module: this.product.name });

				this.$store.commit("showToast", message);

				this.resetForm();

				this.$router.push({ name: "Product", params: { productId: res._id } });
			} catch (err) {
				this.setError(err);
			} finally {
				this.isBusy = false;
			}
		},

		handleCancel() {
			this.resetForm();

			this.$router.push({ name: "Products" });
		},

		resetForm() {
			this.product = {
				name: null,
				barcodeType: "CODE128",
				code: null,
				price: null,
				cost: null,
				minimumStock: 0,
				tax: 0,
				taxMethod: "inclusive",
				category: null,
				brand: null,
				unit: null,
				purchaseUnit: null,
				saleUnit: null,
				images: [],
				availableForSale: true,
				availableForPurchase: true,
				variants: [],
				note: null
			};

			this.resetError();

			this.setOne({});

			this.$nextTick(this.$v.$reset);
		}
	}
};
</script>

<style lang="scss">
.input-group > .input-group-prepend > .btn-group > button.btn.tax-method-toggler {
	background-color: #e9ecef;
	border: 1px solid #ced4da;
	border-left: 0;
	border-top-right-radius: 0.25rem;
	border-bottom-right-radius: 0.25rem;
	color: #333;
	&:hover {
		color: #333;
		background-color: #fff;
	}
}

input#tax + .input-group-prepend > .input-group-text {
	border-left: 0;
}

input#code + .input-group-prepend > .input-group-text {
	border-top-right-radius: 0.25rem;
	border-bottom-right-radius: 0.25rem;
	border-left: 0;
	&:hover {
		color: #333;
		background-color: #fff;
	}
}
</style>
