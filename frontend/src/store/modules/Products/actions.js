import axios from "@/plugins/axios";

export default {
	async getEdit({ commit }, productId) {
		let data = await axios.get(`/products/${productId}/edit`);
		commit("setOne", data.doc);
		return data;
	},

	async changeAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/change-availability`, { [payload.action.name]: payload.action.isAvailable });

		data.productId = payload.productId;

		commit("setAvailability", data);

		return data;
	},

	async changeVariantAvailability({ commit }, payload) {
		let data = await axios.post(`/variants/${payload.variantId}/change-availability`, { [payload.action.name]: payload.action.isAvailable });

		data.productId = payload.productId;

		commit("setVariantAvailability", data);

		return data;
	},

	async createVariant({ commit }, payload) {
		let data = await axios.post("/variants", payload);

		data.productId = payload.productId;

		commit("createVariant", data);

		return data;
	},

	async updateVariant({ commit }, payload) {
		let data = await axios.put(`/variants/${payload._id}`, payload);

		data.productId = payload.productId;

		commit("updateVariant", data);

		return data;
	},

	async getVariants({ commit }, productId) {
		let data = await axios.get(`/variants?product=${productId}`);

		data.productId = productId;

		commit("setVariants", data);

		return data;
	},

	async getVariantStocks({ commit }, payload) {
		let data = await axios.get(`/variants/${payload.variantId}/stocks`);

		data.productId = payload.productId;

		data.variantId = payload.variantId;

		commit("setVariantStocks", data);

		return data;
	},

	async changeProductImage({ commit }, payload) {
		await axios.put(`/products/${payload.productId}/change-image`, payload);

		commit("setImage", payload);

		return true;
	},

	async changeVariantImages({ commit }, payload) {
		await axios.put(`/variants/${payload.variantId}/change-images`, payload);

		commit("setVariantImages", payload);

		return true;
	},

	async changeVariantDefaultImage({ commit }, payload) {
		await axios.put(`variants/${payload.variantId}/change-default-image`, payload);

		commit("setVariantDefaultImage", payload);

		return true;
	},

	async getOptions({ commit }, { warehouse, type }) {
		let data = await axios.get(`/products/options?warehouse=${warehouse}&type=${type}`);

		data.warehouse = warehouse;

		data.type = type;

		commit("setOptions", data);

		return data;
	}
};
