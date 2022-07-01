export default {
	setOne(state, doc) {
		state.one = { ...doc, variants: [] };
	},

	setAvailability(state, data) {
		if (state.one._id == data.productId) {
			this.commit("Products/updateOne", { availableForSale: data.availableForSale });
		}
	},

	setVariantAvailability(state, data) {
		if (state.one._id == data.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == data.variantId);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			state.one.variants[oldVariantIndex][data.action.name] = data.action.isAvailable;

			this.commit("Products/updateOne");
		}
	},

	setImage(state, payload) {
		if (state.one._id == payload.productId) {
			this.commit("Products/updateOne", { image: payload.image });
		}
	},

	createVariant(state, data) {
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

	setVariants(state, data) {
		if (state.one?._id == data.productId) {
			state.one.variants = data.variants.map(variant => {
				variant.stocks = variant.stocks || [];
				return variant;
			});
		}
	},

	setVariantStocks(state, data) {
		if (state.one?._id == data.productId) {
			let oldVariantIndex = state.one?.variants?.findIndex((variant) => variant._id == data.variantId);

			if ([-1, undefined].includes(oldVariantIndex)) return;

			state.one.variants[oldVariantIndex].stocks = data.doc.stocks;
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

	setOptions(state, { type, options, warehouse }) {
		state.options[type] = options.map((option) => ({ ...option, warehouse }));
	}
};
