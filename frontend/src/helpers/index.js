export const getCode = (evt) => {
	if (evt.keyCode !== undefined) {
		return evt.keyCode;
	} else if (evt.keyIdentifier !== undefined) {
		return evt.keyIdentifier;
	} else if (evt.key !== undefined) {
		return evt.key.toLowerCase().charCodeAt(0);
	} else if (evt.which !== undefined) {
		return evt.which;
	} else {
		return undefined;
	}
};

export const getDate = (date, getNew) => {
	if (!date) {
		if (getNew) {
			date = new Date();
		} else {
			return null;
		}
	}

	let d = new Date(date);
	let day = d.getDate();
	let month = d.getMonth() + 1;
	let year = d.getFullYear();

	month = month < 10 ? "0" + month : month;
	day = day < 10 ? "0" + day : day;

	return year + "-" + month + "-" + day;
};

export class ProductPurchaseOption {
	constructor(product) {
		this._id = product._id;
		this.code = product.code;
		this.name = product.name;
		this.image = product.image;
		this.amount = product.cost;
		this.tax = product.tax;
		this.taxMethod = product.taxMethod;
		this.unit = product.unit;
		this.purchaseUnit = product.purchaseUnit;
		this.discount = product.discount || 0;
		this.discountMethod = product.discountMethod || "fixed";
		this.quantity = product.quantity || 1;

		this.variants = product.variants;
		return this;
	}
}

// export class ProductDetail {
// 	constructor(product) {
// 		// this.
// 	}
// }
