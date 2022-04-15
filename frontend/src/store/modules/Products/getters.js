export default {
	options(state) {
		return (invoiceName, warehouse) => {
			let options = state.options[invoiceName] || [];

			options = options.filter((opt) => opt.warehouse == warehouse);

			let filterdOptions = [];

			for (let product of options) {
				for (let variant of product.variants) {
					let option = { ...product };

					option.discount = 0;

					option.discountMethod = "fixed";

					option.quantity = 1;

					option.stock = variant.stock;

					option.variantId = variant._id;

					option.variantName = variant.name;

					option.image = variant.image || product.image;

					delete option.variants;

					filterdOptions.push(option);
				}
			}

			return filterdOptions;
		};
	}
};
