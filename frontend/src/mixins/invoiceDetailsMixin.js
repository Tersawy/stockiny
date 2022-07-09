const InvoiceDetailForm = () => import("@/components/InvoiceDetailForm");

const InvoiceDetailsTable = () => import("@/components/InvoiceDetailsTable");

export default (options = {}) => {
    let defaultOptions = { storeNameSpace: "", amountType: "Price", checkQuantity: false };

    let { storeNameSpace, amountType, checkQuantity } = { ...defaultOptions, ...options };

    return {
        components: { InvoiceDetailsTable, InvoiceDetailForm },

        data: () => ({
            detail: null,

            detailsFields: [
                { key: "image", label: "Image" },
                { key: "name", label: "Name" },
                { key: "netUnitAmount", label: `Net Unit ${amountType}` },
                { key: "instockBySubUnit", label: "Instock" },
                { key: "quantity", label: "Quantity" },
                { key: "discountUnitAmount", label: "Discount" },
                { key: "netUnitTax", label: "Tax" },
                { key: "subtotalUnitAmount", label: `Subtotal ${amountType}` },
                { key: "actions", label: "Actions" }
            ]
        }),

        watch: {
            //? this updates product cost or price in productDetailForm when subUnit changed
            "detail.subUnit"(newValue, oldValue) {
                // ? check if last value not null this because when open the productDetailForm last value already null
                //? This subUnit has been changed so we need to reset product amount input in productDetailForm
                if (oldValue && newValue) {
                    let productOption = this.productOptions.find((opt) => opt.product == this.detail.product);

                    /*
                        mainAmount this becuase in update maybe the product that match this detail not found in productOptions and
                         the reason is that the product has been deleted, disabled or don't have instockBySubUnit
                     */
                    this.detail.amount = productOption ? productOption.amount : this.detail.mainAmount;

                    this.detail.subUnitAmount = this.subUnitAmount(this.detail);
                }
            },

            "detail.subUnitAmount"(value) {
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
            }
        },

        methods: {
            addDetail(product) {
                if (!this.invoice.warehouse && !this.invoice.fromWarehouse) return alert("Please choose the warehouse first");

                if (typeof product.quantity === "undefined") {
                    let instockBySubUnit = this.instockBySubUnit(product);
                    product.quantity = instockBySubUnit < 1 && product.instock > 0 ? instockBySubUnit : 1;
                }

                let detail = this.net(product);

                detail.decrementBtn = "primary";
                detail.incrementBtn = "primary";
                detail.stockVariant = "outline-success";

                this.invoice.details.push(detail);
            },

            editDetail(detail) {
                this.detail = { ...detail };

                this.$bvModal.show("detailFormModal");
            },

            updateDetail(detail) {
                detail = detail || this.detail;

                let details = [...this.invoice.details];

                this.invoice.details = [];

                details = details.map((oldDetail) => {
                    if (oldDetail.product == detail.product && oldDetail.variantId == detail.variantId) {
                        oldDetail = this.net(detail);
                        for (let key in detail) {
                            oldDetail[key] = detail[key];
                        }
                    }
                    return oldDetail;
                });

                this.$nextTick(() => {
                    this.invoice.details = details;
                });
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

            instockBySubUnit(product) {
                // this instock depended on main unit and it is come from api;
                let instockBySubUnit = +product.instock;

                if (!instockBySubUnit) return 0;

                let subUnit = this.subUnit(product);

                //? reverse operator if sub unit is not main unit to get right instock value
                let isMultiple = subUnit.operator === "*" && subUnit._id == product.unit;

                instockBySubUnit = isMultiple ? instockBySubUnit * +subUnit.value : instockBySubUnit / +subUnit.value;

                return instockBySubUnit;
            },

            net(product) {
                product.subUnitAmount = this.subUnitAmount(product);
                product.netUnitAmount = this.netUnitAmount(product);
                product.netUnitTax = this.netUnitTax(product);
                product.discountUnitAmount = this.discountUnitAmount(product);
                product.totalUnitAmount = this.totalUnitAmount(product);
                product.subtotalUnitAmount = this.subtotalUnitAmount(product);
                product.instockBySubUnit = this.instockBySubUnit(product);
                product.subUnitShorName = this.subUnit(product)?.shortName;

                return product;
            },

            incrementQuantity(row) {
                this.$store.commit(`${storeNameSpace}/resetErrorByField`, `details[${row.index}].quantity`);

                if (/^\d+$|^\d+\.\d+$|^\.\d+$/.test(row.item.quantity)) {
                    if ((checkQuantity && !this.isUpdate) || (this.isUpdate && this.oldInvoice.warehouse != this.invoice.warehouse)) {
                        if (row.item.quantity >= row.item.instockBySubUnit) {
                            if (row.item.timeout) clearTimeout(row.item.timeout);
                            row.item.stockVariant = "outline-danger";
                            row.item.incrementBtn = "danger";
                            row.item.timeout = setTimeout(() => {
                                row.item.stockVariant = "outline-success";
                                row.item.incrementBtn = "primary";
                                this.updateDetail(row.item);
                            }, 300);
                        } else if (row.item.quantity + 1 > row.item.instockBySubUnit) {
                            row.item.quantity = row.item.instockBySubUnit;
                        } else {
                            row.item.quantity += 1;
                        }
                    } else {
                        row.item.quantity += 1;
                    }
                } else {
                    row.item.quantity = row.item.instockBySubUnit || 1;
                }

                this.updateDetail(row.item);
            },

            decrementQuantity(row) {
                this.$store.commit(`${storeNameSpace}/resetErrorByField`, `details[${row.index}].quantity`);

                if (/^\d+$|^\d+\.\d+$|^\.\d+$/.test(row.item.quantity) && row.item.quantity - 1 > 0) {
                    row.item.quantity -= 1;
                } else {
                    if (row.item.quantity == 1 || row.item.quantity == row.item.instockBySubUnit) {
                        if (row.item.timeout) clearTimeout(row.item.timeout);

                        row.item.decrementBtn = "danger";

                        row.item.timeout = setTimeout(() => {
                            row.item.decrementBtn = "primary";

                            this.updateDetail(row.item);
                        }, 300);
                    } else {
                        row.item.quantity = row.item.instockBySubUnit || 1;
                    }
                }

                this.updateDetail(row.item);
            },

            quantityChanged(row, value) {
                this.$store.commit(`${storeNameSpace}/resetErrorByField`, `details[${row.index}].quantity`);

                let regex = /^\d+$|^\d+\.\d+$|^\.\d+$/;

                let detail = JSON.parse(JSON.stringify(row.item));

                detail.quantity = parseFloat(value);

                let isValid = regex.test(detail.quantity);

                if (!isValid || row.item.quantity <= 0) {
                    row.item.quantity = row.item.instockBySubUnit || 1;
                    return;
                }

                if (checkQuantity) {
                    if (!this.isUpdate || (this.isUpdate && this.oldInvoice.warehouse != this.invoice.warehouse)) {
                        if (!isValid || (detail.instockBySubUnit < detail.quantity)) {
                            detail.quantity = detail.instockBySubUnit || 1;
                        }
                    }
                }

                this.updateDetail(detail);
            },

            removeDetail(index) {
                this.invoice.details = this.invoice.details.filter((_p, i) => i != index);
            }
        }
    };
};
