export default {
	options(state) {
		return (type, warehouse) => {
			let options = state.options[type] || [];

			options = options.filter((opt) => opt.warehouse == warehouse);

			let filterdOptions = [];

			for (let product of options) {
				for (let variant of product.variants) {
					let option = { ...product };

					option.discount = 0;

					option.discountMethod = "fixed";

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
