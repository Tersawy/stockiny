const express = require("express");

const router = express.Router();

const { authFor } = require("../../middlewares/auth.guard");

const Controller = require("./PurchaseController");

const validation = require("./purchase.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:purchases"), Controller.getPurchases);

router.post("/", authFor("create:purchases"), validation.createPurchase, validationHandler, Controller.createPurchase);

/* Get Purchase To Edit */
router.get("/:id/edit", authFor("edit:purchases"), validation.getEditPurchase, validationHandler, Controller.getEditPurchase);

router.put("/:id", authFor("edit:purchases"), validation.updatePurchase, validationHandler, Controller.updatePurchase);

// router.delete("/:id", authFor("delete:purchases"), validation.delete, validationHandler, Controller.delete);

module.exports = router;
