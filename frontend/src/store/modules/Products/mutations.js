export default {
	setSaleAvailability(state, data) {
		if (state.one._id == data.productId) {
			this.commit("Products/updateOne", { availableForSale: data.availableForSale });
		}
	},

	setPurchaseAvailability(state, data) {
		if (state.one._id == data.productId) {
			this.commit("Products/updateOne", { availableForPurchase: data.availableForPurchase });
		}
	},

	setVariantSaleAvailability(state, data) {
		if (state.one._id == data.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == data.variantId);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			state.one.variants[oldVariantIndex].availableForSale = data.availableForSale;

			this.commit("Products/updateOne");
		}
	},

	setVariantPurchaseAvailability(state, data) {
		if (state.one._id == data.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == data.variantId);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			state.one.variants[oldVariantIndex].availableForPurchase = data.availableForPurchase;

			this.commit("Products/updateOne");
		}
	},

	setImage(state, payload) {
		if (state.one._id == payload.productId) {
			this.commit("Products/updateOne", { image: payload.image });
		}
	},

	addVariant(state, data) {
		data.variant.stock = 0;
		// data.variant.stocks = [];

		if (state.one?._id == data.productId) {
			let variants = Array.isArray(state.one.variants) ? [...state.one.variants, data.variant] : [data.variant];

			state.one.variants = variants;

			this.commit("Products/updateOne");
		}
	},

	updateVariant(state, data) {
		if (state.one?._id == data.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == data.variant._id);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			data.variant.stock = state.one.variants[oldVariantIndex].stock;

			state.one.variants[oldVariantIndex] = data.variant;

			this.commit("Products/updateOne");
		}
	},

	setVariantStocks(state, data) {
		if (state.one?._id == data.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == data.variantId);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			state.one.variants[oldVariantIndex].stock = data.doc.stock;
		}
	},

	setVariantImages(state, payload) {
		if (state.one?._id == payload.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == payload.variantId);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			state.one.variants[oldVariantIndex].images = payload.images.map((image, i) => ({ name: image, default: i == 0 }));

			this.commit("Products/updateOne");
		}
	},

	setVariantDefaultImage(state, payload) {
		if (state.one?._id == payload.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == payload.variantId);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			let variant = state.one.variants[oldVariantIndex];

			variant.images = variant.images.map((image) => ({ ...image, default: image.name == payload.image }));

			variant.updatedAt = new Date();

			this.commit("Products/updateOne");
		}
	},

	setOptions(state, { invoiceName, options, warehouse }) {
		state.options[invoiceName] = state.options[invoiceName].filter((option) => option.warehouse != warehouse);

		state.options[invoiceName] = options.map((option) => ({ ...option, warehouse }));
	}
	// details(state, res) {
	// 	state.details = res.data;
	// }
};
