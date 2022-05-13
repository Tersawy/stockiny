const express = require("express");

const router = express.Router();

const { authFor, authForAny, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./ProductController");

const validation = require("./product.validations");

const validationHandler = require("../../middlewares/validationHandler");

const fileUpload = require("express-fileupload");

/* Get Products */
router.get("/", authFor("read:products"), Controller.products);

/* Get Product To Edit */
router.get("/:id/edit", authFor("edit:products"), validation.getEdit, validationHandler, Controller.getEdit);

/* Get Product Options To Make Invoices */
router.get("/options", isAuth, validation.getOptions, validationHandler, Controller.getOptions);

/* Get Product To Show */
router.get("/:id", authForAny("show:products"), Controller.product);

/* Create Product */
router.post("/", authFor("create:products"), fileUpload(), validation.create, validationHandler, Controller.create);

/* Update Product */
router.put("/:id", authFor("edit:products"), validation.update, validationHandler, Controller.update);

/* Delete Product */
router.delete("/:id", authFor("delete:products"), validation.delete, validationHandler, Controller.delete);

/* Change Product Sale Availability */
router.post(
	"/:id/change-sale-availability",
	authForAny("edit:products"),
	validation.changeSaleAvailability,
	validationHandler,
	Controller.changeSaleAvailability
);

/* Change Product Sale Return Availability */
router.post(
	"/:id/change-sale-return-availability",
	authForAny("edit:products"),
	validation.changeSaleReturnAvailability,
	validationHandler,
	Controller.changeSaleReturnAvailability
);

/* Change Product Purchase Availability */
router.post(
	"/:id/change-purchase-availability",
	authForAny("edit:products"),
	validation.changePurchaseAvailability,
	validationHandler,
	Controller.changePurchaseAvailability
);

/* Change Product Purchase Availability */
router.post(
	"/:id/change-purchase-return-availability",
	authForAny("edit:products"),
	validation.changePurchaseReturnAvailability,
	validationHandler,
	Controller.changePurchaseReturnAvailability
);

/* Add Variant */
router.post(
	"/:id/variants",
	authForAny("edit:products"),
	validation.addVariant,
	validationHandler,
	Controller.addVariant
);

/* Update Variant */
router.put(
	"/:id/variants/:variantId",
	authForAny("edit:products"),
	validation.updateVariant,
	validationHandler,
	Controller.updateVariant
);

/* Update Variant */
router.get(
	"/:id/variants/:variantId/stocks",
	authForAny("show:products"),
	validation.getVariantStocks,
	validationHandler,
	Controller.getVariantStocks
);

/* Change Variant Sale Availability */
router.post(
	"/:id/variants/:variantId/change-sale-availability",
	authForAny("edit:products"),
	validation.changeVariantSaleAvailability,
	validationHandler,
	Controller.changeVariantSaleAvailability
);

/* Change Variant Purchase Availability */
router.post(
	"/:id/variants/:variantId/change-purchase-availability",
	authForAny("edit:products"),
	validation.changeVariantPurchaseAvailability,
	validationHandler,
	Controller.changeVariantPurchaseAvailability
);

/* Change Variant SaleReturn Availability */
router.post(
	"/:id/variants/:variantId/change-sale-return-availability",
	authForAny("edit:products"),
	validation.changeVariantSaleReturnAvailability,
	validationHandler,
	Controller.changeVariantSaleReturnAvailability
);

/* Change Variant PurchaseReturn Availability */
router.post(
	"/:id/variants/:variantId/change-purchase-return-availability",
	authForAny("edit:products"),
	validation.changeVariantPurchaseReturnAvailability,
	validationHandler,
	Controller.changeVariantPurchaseReturnAvailability
);

/* Change Product Image */
router.put(
	"/:id/change-image",
	authForAny("edit:products"),
	validation.changeImage,
	validationHandler,
	Controller.changeImage
);

/* Change Variant Images */
router.put(
	"/:id/variants/:variantId/change-images",
	authForAny("edit:products"),
	validation.changeVariantImages,
	validationHandler,
	Controller.changeVariantImages
);

/* Change Product Image */
router.put(
	"/:id/variants/:variantId/change-default-image",
	authForAny("edit:products"),
	validation.changeVariantDefaultImage,
	validationHandler,
	Controller.changeVariantDefaultImage
);

module.exports = router;
