<template>
	<main-content :breads="breads">
		<template #end-breads>
			<div class="d-flex align-items-center">
				<!-- Cancel Button -->
				<b-button variant="outline-danger" size="sm" @click="handleCancel" class="ml-2"> Go To Products </b-button>
			</div>
		</template>

		<b-row class="mt-4">
			<b-col cols="12" lg="8">
				<!-- Product Details -->
				<b-card>
					<template #header>
						<div class="d-flex justify-content-between align-items-center">
							<span>Product Details</span>
							<div class="d-flex align-items-center">
								<router-link :to="{ name: 'ProductEdit', params: { productId } }" class="btn btn-sm btn-outline-success d-flex align-items-center">
									<EditIcon width="10px" />
									<span style="margin-top: 1px" class="d-none d-sm-inline ml-2">Edit</span>
								</router-link>

								<b-btn variant="outline-dark" size="sm" class="gallery-btn mx-2 d-flex align-items-center" @click="openVariantForm(null)">
									<VariantIcon class="gallery-btn-icon" />
									<span style="margin-top: 1px" class="d-none d-sm-inline ml-1">Add Variant</span>
								</b-btn>

								<b-btn variant="outline-primary" size="sm" class="gallery-btn d-flex align-items-center" @click="openGallery">
									<GalleryIcon class="gallery-btn-icon" />
									<span style="margin-top: 1px" class="d-none d-sm-inline ml-1">Gallery</span>
								</b-btn>
							</div>
						</div>
					</template>
					<b-row cols="1" cols-sm="2">
						<b-col cols="12" sm="12" class="text-center mb-2 d-lg-none">
							<Barcode :value="product.code" :format="product.barcodeType" :flat="barcodeTypeFlat" />
						</b-col>

						<b-col
							v-for="(field, i) in Object.keys(productData)"
							class="py-2 product-field"
							:key="i"
							:class="{ 'striped-mobile': striped(i).mobile, 'striped-sm': striped(i).sm }"
						>
							<b-row no-gutters>
								<b-col>
									<strong>{{ field | toSentenceCase }}: </strong>
								</b-col>
								<b-col>
									<DateStr v-if="['createdAt', 'updatedAt'].includes(field)" :date="productData[field]" />

									<template v-else-if="field == 'barcodeType' && showBarcodeTypeFlatBtn">
										<b-btn size="sm" variant="outline-success" class="py-0 px-1 ml-4" @click="barcodeTypeFlat = !barcodeTypeFlat">
											{{ barcodeTypeFlat ? "Guard bars" : "Flat" }}
										</b-btn>
									</template>

									<span v-else> {{ productData[field] }} </span>
								</b-col>
							</b-row>
						</b-col>
					</b-row>

					<!-- Product Notes -->
					<b-row>
						<b-col :cols="product.notes ? 6 : 12" class="d-none d-lg-block">
							<div class="d-flex w-100 align-items-center justify-content-center"></div>
							<Barcode :value="product.code" :format="product.barcodeType" :flat="barcodeTypeFlat" />
						</b-col>
						<b-col v-if="product.notes" class="product-field py-2 striped mt-0 mt-sm-3 mt-lg-0">
							<strong class="text-success">-- Notes --</strong>
							<p class="pl-2 pl-lg-3 mt-1 mb-0">{{ product.notes }}</p>
						</b-col>
					</b-row>
				</b-card>
			</b-col>

			<b-col cols="12" lg="4" class="mt-4 mt-lg-0">
				<div class="d-flex flex-column h-100">
					<!-- Product Image -->
					<b-card class="h-100">
						<template #header>
							<div class="d-flex justify-content-between align-items-center">
								<span>Product Image</span>
								<b-btn variant="outline-primary" size="sm" class="gallery-btn d-flex align-items-center" @click="openProductGallery">
									<GalleryIcon class="gallery-btn-icon" />
									<span style="margin-top: 1px" class="d-none d-sm-inline ml-1">Image</span>
								</b-btn>
							</div>
						</template>
						<div class="h-100 d-flex align-items-center justify-content-center">
							<div v-if="product.image" class="h-100 d-flex align-items-center justify-content-center" :style="`max-height: ${productImageIconHeight}`">
								<b-img :src="`${BASE_URL}/images/products/${productId}/${product.image}`" thumbnail style="max-height: 100%" />
							</div>
							<GalleryIcon v-else class="c-pointer" width="100%" :height="productImageIconHeight" color="#ddd" @click="openProductGallery" />
						</div>
					</b-card>

					<!-- Product Controls -->
					<b-card header="Product Controls" class="mt-4">
						<b-row cols="1" cols-md="2" cols-lg="1">
							<b-col>
								<b-form-checkbox @change="changeSaleAvailability" v-model="product.availableForSale" switch class="mx-3 mb-3 mb-md-0 mb-lg-3 text-nowrap">
									Is Available For Sale ?
								</b-form-checkbox>
							</b-col>
							<b-col>
								<b-form-checkbox @change="changePurchaseAvailability" v-model="product.availableForPurchase" switch class="mx-3 text-nowrap">
									Is Available For Purchase ?
								</b-form-checkbox>
							</b-col>
						</b-row>
					</b-card>
				</div>
			</b-col>

			<!-- Product Variants -->
			<b-col>
				<b-row cols="1" class="mb-3">
					<b-col v-for="variant in product.variants" :key="variant._id" class="mt-4">
						<b-card>
							<template #header>
								<div class="d-flex justify-content-between align-items-center">
									<div class="title">
										<span>Variant</span>
										<b-badge variant="outline-primary" class="mx-2">{{ variant.name }}</b-badge>
									</div>
									<div class="d-flex align-items-center">
										<b-btn variant="outline-success" size="sm" class="d-flex align-items-center mx-2" @click="openVariantForm(variant)">
											<EditIcon width="10px" />
											<span style="margin-top: 1px" class="d-none d-sm-inline ml-2">Edit</span>
										</b-btn>
										<b-btn variant="outline-primary" size="sm" class="gallery-btn d-flex align-items-center" @click="openVariantGallery(variant)">
											<GalleryIcon class="gallery-btn-icon" />
											<span style="margin-top: 1px" class="d-none d-sm-inline ml-1">Images</span>
										</b-btn>
									</div>
								</div>
							</template>
							<b-row>
								<b-col cols="12" lg="8">
									<b-row cols="1" cols-md="2" class="mr-lg-0">
										<b-col class="py-2 product-field striped">
											<b-row no-gutters>
												<b-col cols="4">
													<strong>Name: </strong>
												</b-col>
												<b-col>{{ variant.name }}</b-col>
											</b-row>
										</b-col>
										<b-col class="py-2 product-field">
											<b-row no-gutters>
												<b-col cols="4" class="font-weight-bold"> Created At: </b-col>
												<b-col>
													<DateStr :date="variant.createdAt" />
												</b-col>
											</b-row>
										</b-col>
										<b-col class="py-2 product-field striped striped-md-none">
											<b-row no-gutters>
												<b-col cols="4" class="font-weight-bold"> In-Stock: </b-col>
												<b-col>
													<div class="d-flex align-items-center">
														<b-badge :variant="'outline-' + (+variant.stock <= product.minimumStock ? 'danger' : 'success')">
															{{ sumVariantStocks(variant) }} {{ product.unit.shortName }}
														</b-badge>
														<a v-if="variant.stock != 0 && !Array.isArray(variant.stock)" class="text-info mx-3" @click="showVariantStocks(variant)">
															<EyeIcon />
														</a>
													</div>
												</b-col>
											</b-row>
										</b-col>
										<b-col class="py-2 product-field striped-md" v-if="variant.updatedAt">
											<b-row no-gutters>
												<b-col cols="4" class="font-weight-bold"> Updated At: </b-col>
												<DateStr :date="variant.createdAt" />
											</b-row>
										</b-col>
										<b-col class="py-2 product-field d-flex striped-md" :class="{ striped: variant.updatedAt }">
											<span class="font-weight-bold mr-5 mr-md-3 pr-4 pr-md-0"> Available For Sale: </span>
											<!-- eslint-disable-next-line -->
											<b-form-checkbox @change="changeVariantSaleAvailability($event, variant)" v-model="variant.availableForSale" switch />
										</b-col>
										<b-col class="py-2 product-field d-flex" :class="{ 'striped striped-md': !variant.updatedAt }">
											<span class="font-weight-bold mr-2 mr-md-3 pr-4 pr-md-0"> Available For Purchase: </span>
											<!-- eslint-disable-next-line -->
											<b-form-checkbox class="ml-1 ml-md-0" @change="changeVariantPurchaseAvailability($event, variant)" v-model="variant.availableForPurchase" switch />
										</b-col>
									</b-row>
									<template v-if="Array.isArray(variant.stock)">
										<table class="table table-bordered table-hover mt-4">
											<thead>
												<tr>
													<th>Warehouse</th>
													<th>Instock</th>
												</tr>
											</thead>
											<tbody>
												<template v-for="(stock, i) of variant.stock">
													<tr :key="i" v-if="stock.quantity != 0">
														<th>{{ stock.warehouse.name }}</th>
														<th>
															<b-badge :variant="'outline-' + (+variant.stock <= product.minimumStock ? 'danger' : 'success')">
																{{ stock.quantity }} {{ product.unit.shortName }}
															</b-badge>
														</th>
													</tr>
												</template>
											</tbody>
										</table>
									</template>
								</b-col>
								<b-col cols="12" lg="4" class="mt-4 mt-lg-0 px-0 pl-lg-3">
									<div class="h-100 d-flex align-items-center justify-content-center" style="max-height: 220px">
										<div v-if="defaultVariantImage(variant)" class="h-100 d-flex align-items-start justify-content-center">
											<b-img
												:src="`${BASE_URL}/images/products/${productId}/${defaultVariantImage(variant).name}`"
												thumbnail
												:style="`${variant.images.length > 1 ? 'max-width: calc(100% - 75px);' : ''} height: 100%`"
											/>

											<div class="h-100" style="overflow-y: auto; overflow-x: hidden; width: 70px" v-if="variant.images.length > 1">
												<VuePerfectScrollbar class="scroll-area" :settings="{ suppressScrollX: true, wheelPropagation: false }">
													<div v-for="image in variant.images" :key="image.name" class="mb-1 mx-auto" style="width: 50px; height: 50px">
														<b-img :src="`${BASE_URL}/images/products/${productId}/${image.name}`" class="w-100 h-100" thumbnail />
													</div>
												</VuePerfectScrollbar>
											</div>
										</div>
										<b-col v-else cols="11" md="6" lg="10" xl="8" class="py-2 border rounded-lg c-pointer" @click="openVariantGallery(variant)">
											<GalleryIcon width="100%" :height="variantImageIconHeight" color="#ddd" />
										</b-col>
									</div>
								</b-col>
							</b-row>
						</b-card>
					</b-col>
				</b-row>
			</b-col>
		</b-row>
		<GalleryModal
			ref="galleryModal"
			:title="gallery.title"
			:gallery-url="galleryUrl"
			:image-formatter="galleryImageFormatter"
			:multiple-select="gallery.isMultipleSelect"
			:old-selected="oldSelected"
			:default-old-selected="defaultOldSelected"
			:hide-save-btn="gallery.hideSaveBtn"
			:hide-delete-btn="gallery.hideDeleteBtn"
			:hide-old-selected-view="gallery.hideOldSelectedView"
			:before-delete="beforeDeleteImagesFromGallery"
			@save="handleChangeImages"
			@setDefault="handleSetVariantDefaultImage"
		/>
		<VariantFormModal :variant="variant" />
	</main-content>
</template>

<script>
	import { mapActions, mapMutations, mapState } from "vuex";

	import GalleryIcon from "@/components/icons/gallery.vue";

	import VariantIcon from "@/components/icons/variant.vue";

	import EditIcon from "@/components/icons/edit.vue";

	import EyeIcon from "@/components/icons/eye.vue";

	const DateStr = () => import ("@/components/DateStr.vue");

	const VuePerfectScrollbar = () => import("vue-perfect-scrollbar");

	const GalleryModal = () => import("@/components/Gallery");

	const VariantFormModal = () => import("@/components/forms/ProductVariantForm");

	const Barcode = () => import("vue-barcode");

	export default {
		components: { Barcode, GalleryModal, VariantFormModal, VuePerfectScrollbar, DateStr, EditIcon, GalleryIcon, VariantIcon, EyeIcon },

		data() {
			return {
				breads: [{ title: "Dashboard", link: "/" }, { title: "Products", link: "/products" }, { title: "Show" }],

				gallery: { isMultipleSelect: false, hideOldSelectedView: true, hideSaveBtn: false, hideDeleteBtn: false, title: "Gallery" },

				variant: null,

				isBusy: false,

				barcodeTypeFlat: false
			};
		},

		async mounted() {
			try {
				await this.getProduct(this.$route.params.productId);
			} catch {
				this.$router.push("/products");
			}
		},

		computed: {
			...mapState({
				product: (state) => state.Products.one
			}),

			productId() {
				return this.$route.params.productId;
			},

			productData() {
				let p = this.product;

				let data = {
					name: p.name,
					code: p.code,
					barcodeType: p.barcodeType,
					price: p.price,
					cost: p.cost,
					tax: p.tax + "%",
					taxMethod: p.taxMethod,
					category: p.category?.name || "Unknown",
					brand: p.brand?.name || "Unknown",
					unit: p.unit?.name || "Unknown",
					purchaseUnit: p.purchaseUnit?.name || "Unknown",
					saleUnit: p.saleUnit?.name || "Unknown",
					createdAt: this.getDate(p.createdAt),
					createdBy: p.createdBy?.username || "Unknown",
					minimumStock: p.minimumStock
				};

				if (p.updatedAt) {
					data.updatedAt = this.getDate(p.updatedAt);
					data.updatedBy = p.updatedBy?.username || "Unknown";
				}

				return data;
			},

			showBarcodeTypeFlatBtn() {
				return ["UPC", "EAN8", "EAN13"].includes(this.product.barcodeType);
			},

			galleryUrl() {
				return `/gallery/products/${this.$route.params.productId}`;
			},

			usedImages() {
				let variantsImages = this.product.variants.reduce((acc, v) => {
					if (v.images && v.images.length) {
						acc = acc.concat(v.images.map((i) => i.name));
					}

					return acc;
				}, []);

				return this.product.image ? variantsImages.concat(this.product.image) : variantsImages;
			},

			defaultOldSelected() {
				if (this.variant) {
					return this.variant.images?.find((i) => i.default)?.name || "";
				}

				return this.product.image || "";
			},

			oldSelected() {
				if (this.gallery.hideSaveBtn) return [];

				if (this.variant) {
					return this.variant.images?.map((i) => i.name) || [];
				}

				return this.product.image ? [this.product.image] : [];
			},

			variantImageIconHeight() {
				return "180px";
			},

			productImageIconHeight() {
				//  Without barcode
				// let { updatedAt, notes } = this.product;

				// if (updatedAt && notes) return "200px";

				// if (notes) return "193px";

				// if (updatedAt) return "154px";

				// return "120px";

				let { updatedAt } = this.product;

				if (!updatedAt) return "260px";

				return "296px";
			}
		},

		methods: {
			...mapActions({
				getProduct: "Products/getOne",
				changeProductImage: "Products/changeProductImage",
				changeProductVariantImages: "Products/changeProductVariantImages",
				changeVariantDefaultImage: "Products/changeVariantDefaultImage",
				getVariantStocks: "Products/getVariantStocks"
			}),

			...mapMutations("Products", ["resetErrorByField", "setError", "resetError", "setOne"]),

			async changeSaleAvailability(availableForSale) {
				try {
					let data = { availableForSale, productId: this.productId };

					await this.$store.dispatch("Products/changeSaleAvailability", data);

					this.$store.commit("showMessage");
				} catch (error) {
					console.log(error);
					this.$store.commit("showMessage", { error: true });
				}
			},

			async changePurchaseAvailability(availableForPurchase) {
				try {
					let data = { availableForPurchase, productId: this.productId };

					await this.$store.dispatch("Products/changePurchaseAvailability", data);

					this.$store.commit("showMessage");
				} catch (error) {
					console.log(error);
					this.$store.commit("showMessage", { error: true });
				}
			},

			async changeVariantSaleAvailability(availableForSale, variant) {
				try {
					let data = { availableForSale, productId: this.productId, variantId: variant._id };

					await this.$store.dispatch("Products/changeVariantSaleAvailability", data);

					this.$store.commit("showMessage");
				} catch (error) {
					console.log(error);
					this.$store.commit("showMessage", { error: true });
				}
			},

			async changeVariantPurchaseAvailability(availableForPurchase, variant) {
				try {
					let data = { availableForPurchase, productId: this.productId, variantId: variant._id };

					await this.$store.dispatch("Products/changeVariantPurchaseAvailability", data);

					this.$store.commit("showMessage");
				} catch (error) {
					console.log(error);
					this.$store.commit("showMessage", { error: true });
				}
			},

			effectUnit(detail) {
				let unit = this.units.find((u) => +u.id == +detail.unit_id);

				if (!unit) return detail;

				detail.unit = { ...unit };

				let isDivide = unit.operator == "/";

				let { operator_value } = unit;

				detail.stocky = isDivide ? detail.stock / operator_value : detail.stock * operator_value;

				return detail;
			},

			getDate(date) {
				if (!date) return "*- - -";

				date = new Date(date);

				let dateString = date.toLocaleDateString();

				let timeString = date.toLocaleTimeString().replace(/:\d+ /, " ");

				let day = date.toDateString().split(" ")[0];

				date = day + ", " + dateString + ", " + timeString;

				return date;
			},

			striped(i) {
				return {
					sm: i == 0 || i % 4 == 0 || (i + 1) % 4 == 0,
					mobile: i % 2
				};
			},

			openVariantForm(variant) {
				this.variant = variant;

				this.$nextTick(() => {
					this.$bvModal.show("variantFormModal");
				});
			},

			openGallery() {
				this.$refs.galleryModal?.$reset();

				this.variant = null;

				this.gallery = { isMultipleSelect: true, hideOldSelectedView: true, hideSaveBtn: true, title: "Gallery", hideDeleteBtn: false };

				this.$nextTick(this.$refs.galleryModal.open);
			},

			openProductGallery() {
				this.variant = null;

				this.gallery = { isMultipleSelect: false, hideOldSelectedView: true, hideSaveBtn: false, title: "Product Image", hideDeleteBtn: true };

				this.$nextTick(this.$refs.galleryModal.open);
			},

			openVariantGallery(variant) {
				this.variant = JSON.parse(JSON.stringify(variant));

				this.gallery = { isMultipleSelect: true, hideOldSelectedView: false, hideSaveBtn: false, title: "Variant Images", hideDeleteBtn: true };

				this.$nextTick(this.$refs.galleryModal.open);
			},

			galleryImageFormatter(image) {
				return `${this.BASE_URL}/images/products/${this.productId}/${image}`;
			},

			beforeDeleteImagesFromGallery(selected, prevent) {
				let isAnyOfUsedImagesInDeleted = selected.some((image) => this.usedImages.includes(image));

				if (isAnyOfUsedImagesInDeleted) {
					this.$store.commit("showToast", { variant: "danger", message: "You cannot delete selected images because there are images used in the product." });

					return prevent();
				}
			},

			async handleChangeImages(selected, loading) {
				let data = { productId: this.$route.params.productId },
					action = this.changeProductImage;

				let field = "Product Image";

				let isVariant = this.variant && this.variant._id;

				/* Change Variant Images */
				if (isVariant) {
					data.images = selected;

					data.variantId = this.variant._id;

					action = this.changeProductVariantImages;

					field = "Variant Images";
				} else {
					/* Change Product Image */
					data.image = selected[0] || "";
				}

				loading.saveLoading = true;

				try {
					await action(data);

					let message = this.$t("actions.updated", { module: field });

					this.$store.commit("showToast", message);

					if (isVariant) {
						loading.saveLoading = false;

						this.$nextTick(() => {
							this.variant = this.product.variants.find((v) => v._id == this.variant._id);
						});

						this.$refs.galleryModal.$nextTick(() => this.$refs.galleryModal.changeTab("oldSelected"));
					} else {
						this.$nextTick(this.$refs.galleryModal.close);
					}
				} catch (err) {
					console.log(err);
				} finally {
					loading.saveLoading = false;
				}
			},

			async handleSetVariantDefaultImage(defaultSelected, loading) {
				let data = { productId: this.$route.params.productId, variantId: this.variant._id, image: defaultSelected };

				loading.saveLoading = true;

				try {
					await this.changeVariantDefaultImage(data);

					let message = this.$t("actions.updated", { module: "Variant Image" });

					this.$store.commit("showToast", message);

					this.$nextTick(this.$refs.galleryModal.close);
				} catch (err) {
					console.log(err);
				} finally {
					loading.saveLoading = false;
				}
			},

			defaultVariantImage(variant) {
				return variant.images.find((image) => image.default);
			},

			async showVariantStocks(variant) {
				try {
					await this.getVariantStocks({ productId: this.productId, variantId: variant._id });
				} catch (err) {
					console.log(err);
				}
			},

			sumVariantStocks(variant) {
				if (!Array.isArray(variant.stock)) return +variant.stock || 0;

				return variant.stock.reduce((total, curr) => total + +curr.quantity, 0);
			},

			handleCancel() {
				this.reset();

				this.$router.push({ name: "Products" });
			},

			reset() {
				this.resetError();

				this.setOne({});
			}
		}
	};
</script>

<style lang="scss">
	.striped {
		background-color: var(--light);
	}

	@media (max-width: 576px) {
		.striped-mobile {
			background-color: var(--light);
		}
	}

	@media (min-width: 576px) {
		.striped-sm {
			background-color: var(--light);
		}
	}

	@media (min-width: 768px) {
		.striped-md {
			background-color: var(--light);
		}
		.striped-md-none {
			background-color: transparent;
		}
	}

	// .product-field:nth-child(5n + 1) {
	// 	background-color: var(--light);
	// }
	// .product-field:nth-child(5n) {
	// 	background-color: var(--light);
	// }
	// .product-field {
	// 	// &:nth-child(3n - 1),
	// 	// &:nth-child(5n + 5) {
	// 	&:nth-child(4n - 1),
	// 	&:nth-child(4n) {
	// 		background-color: var(--light);
	// 	}
	// }
	// .product-field:nth-child(4n) {
	// 	background-color: var(--light);
	// }

	.gallery-btn {
		svg.gallery-btn-icon path {
			transition: fill 0.3s ease;
		}
		&.btn-outline-primary {
			svg.gallery-btn-icon path {
				fill: var(--primary);
			}
		}
		&.btn-outline-success {
			svg.gallery-btn-icon path {
				fill: var(--success);
			}
		}
		&:hover {
			svg.gallery-btn-icon path {
				fill: var(--white);
			}
			&.edit-btn {
				svg.gallery-btn-icon {
					polygon,
					path:nth-child(1),
					path:nth-child(2),
					path:nth-child(3),
					path:nth-child(4) {
						fill: var(--white) !important;
					}
				}
			}
		}
	}

	.product-field {
		&:hover {
			background-color: #e7e7e7;
		}
	}
	.scroll-area {
		height: 100%;
	}
</style>
