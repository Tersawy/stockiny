import axios from "@/plugins/axios";

export default {
	async getEdit({ commit }, productId) {
		let data = await axios.get(`/products/${productId}/edit`);
		commit("setOne", data.doc);
		return data;
	},

	async changeSaleAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/change-sale-availability`, payload);

		data.productId = payload.productId;

		commit("setSaleAvailability", data);

		return data;
	},

	async changePurchaseAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/change-purchase-availability`, payload);

		data.productId = payload.productId;

		commit("setPurchaseAvailability", data);

		return data;
	},

	async changeSaleReturnAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/change-sale-return-availability`, payload);

		data.productId = payload.productId;

		commit("setSaleReturnAvailability", data);

		return data;
	},

	async changePurchaseReturnAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/change-purchase-return-availability`, payload);

		data.productId = payload.productId;

		commit("setPurchaseReturnAvailability", data);

		return data;
	},

	async changeVariantSaleAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/variants/${payload.variantId}/change-sale-availability`, payload);

		data.productId = payload.productId;

		commit("setVariantSaleAvailability", data);

		return data;
	},

	async changeVariantPurchaseAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/variants/${payload.variantId}/change-purchase-availability`, payload);

		data.productId = payload.productId;

		commit("setVariantPurchaseAvailability", data);

		return data;
	},

	async changeVariantSaleReturnAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/variants/${payload.variantId}/change-sale-return-availability`, payload);

		data.productId = payload.productId;

		commit("setVariantSaleReturnAvailability", data);

		return data;
	},

	async changeVariantPurchaseReturnAvailability({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/variants/${payload.variantId}/change-purchase-return-availability`, payload);

		data.productId = payload.productId;

		commit("setVariantPurchaseReturnAvailability", data);

		return data;
	},

	async addVariant({ commit }, payload) {
		let data = await axios.post(`/products/${payload.productId}/variants`, payload);

		data.productId = payload.productId;

		commit("addVariant", data);

		return data;
	},

	async updateVariant({ commit }, payload) {
		let data = await axios.put(`/products/${payload.productId}/variants/${payload._id}`, payload);

		data.productId = payload.productId;

		commit("updateVariant", data);

		return data;
	},

	async getVariantStocks({ commit }, payload) {
		let data = await axios.get(`/products/${payload.productId}/variants/${payload.variantId}/stocks`, payload);

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

	async changeProductVariantImages({ commit }, payload) {
		let url = `/products/${payload.productId}/variants/${payload.variantId}/change-images`;

		await axios.put(url, payload);

		commit("setVariantImages", payload);

		return true;
	},

	async changeVariantDefaultImage({ commit }, payload) {
		let url = `/products/${payload.productId}/variants/${payload.variantId}/change-default-image`;

		await axios.put(url, payload);

		commit("setVariantDefaultImage", payload);

		return true;
	},

	async getPurchaseOptions({ commit }, { warehouse }) {
		let data = await axios.get(`/products/purchase-options?warehouse=${warehouse}`);

		data.warehouse = warehouse;

		data.invoiceName = "purchase";

		commit("setOptions", data);

		return data;
	},

	async getSaleOptions({ commit }, { warehouse }) {
		let data = await axios.get(`/products/sale-options?warehouse=${warehouse}`);

		data.warehouse = warehouse;

		data.invoiceName = "sale";

		commit("setOptions", data);

		return data;
	}

	// async details({ commit }, payload) {
	// 	let data = await axios.post("/products/details", payload);
	// 	commit("details", data);
	// 	return data;
	// },

	// async create({ dispatch }, payload) {
	// 	let data = await axios.post("/products/create", payload);
	// 	dispatch("all");
	// 	return data;
	// },

	// async update({ dispatch }, item) {
	// 	let data = await axios.put(`/products/${item._id}`, item);
	// 	dispatch("all");
	// 	return data;
	// }
};
