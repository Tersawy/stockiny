const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./PurchaseController");

const validation = require("./purchase.validations");

const validationHandler = require("../../middlewares/validationHandler");

const generateStatusRoutes = require("../status/status.service");

generateStatusRoutes({
    router,
    module: {
        name: "purchases",
        middlewares: {
            get: isAuth,
            create: authFor("createStatus:purchases"),
            update: authFor("editStatus:purchases"),
            remove: authFor("deleteStatus:purchases"),
            changeEffectedStatus: authFor("changeEffectedStatus:purchases")
        }
    }
});

router.get("/", authFor("read:purchases"), Controller.getPurchases);

router.post("/", authFor("create:purchases"), validation.createPurchase, validationHandler, Controller.createPurchase);

router.get("/:id", authFor("show:purchases"), validation.getPurchase, validationHandler, Controller.getPurchase);

/* Get Purchase To Edit */
router.get("/:id/edit", authFor("edit:purchases"), validation.getEditPurchase, validationHandler, Controller.getEditPurchase);

router.put("/:id", authFor("edit:purchases"), validation.updatePurchase, validationHandler, Controller.updatePurchase);

router.post("/:id/change-status", authFor("edit:purchases"), validation.changePurchaseStatus, validationHandler, Controller.changePurchaseStatus);

// router.delete("/:id", authFor("delete:purchases"), validation.delete, validationHandler, Controller.delete);

router.get("/:id/payments", authFor("showPayment:purchases"), validation.getPayments, validationHandler, Controller.getPayments);

router.post("/:id/payments", authFor("createPayment:purchases"), validation.createPayment, validationHandler, Controller.createPayment);

router.put("/:id/payments/:paymentId", authFor("editPayment:purchases"), validation.updatePayment, validationHandler, Controller.updatePayment);

router.delete("/:id/payments/:paymentId", authFor("deletePayment:purchases"), validation.deletePayment, validationHandler, Controller.deletePayment);

module.exports = router;
