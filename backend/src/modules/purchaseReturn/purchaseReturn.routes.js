const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./PurchaseReturnController");

const validation = require("./purchaseReturn.validations");

const validationHandler = require("../../middlewares/validationHandler");

const generateStatusRoutes = require("../status/status.service");

generateStatusRoutes({
    router,
    module: {
        name: "purchasesReturn",
        middlewares: {
            get: isAuth,
            create: authFor("createStatus:purchasesReturn"),
            update: authFor("editStatus:purchasesReturn"),
            remove: authFor("deleteStatus:purchasesReturn"),
            changeEffectedStatus: authFor("changeEffectedStatus:purchasesReturn")
        }
    }
});

router.get("/", authFor("read:purchasesReturn"), validation.getPurchasesReturn, Controller.getPurchasesReturn);

router.post("/", authFor("create:purchasesReturn"), validation.createPurchaseReturn, validationHandler, Controller.createPurchaseReturn);

router.get("/:id", authFor("show:purchasesReturn"), validation.getPurchaseReturn, validationHandler, Controller.getPurchaseReturn);

/* Get PurchaseReturn To Edit */
router.get("/:id/edit", authFor("edit:purchasesReturn"), validation.getEditPurchaseReturn, validationHandler, Controller.getEditPurchaseReturn);

router.put("/:id", authFor("edit:purchasesReturn"), validation.updatePurchaseReturn, validationHandler, Controller.updatePurchaseReturn);

router.post("/:id/change-status", authFor("edit:purchasesReturn"), validation.changePurchaseReturnStatus, validationHandler, Controller.changePurchaseReturnStatus);

router.delete("/:id", authFor("delete:purchasesReturn"), validation.deletePurchaseReturn, validationHandler, Controller.deletePurchaseReturn);

router.get("/:id/payments", authFor("showPayment:purchasesReturn"), validation.getPayments, validationHandler, Controller.getPayments);

router.post("/:id/payments", authFor("createPayment:purchasesReturn"), validation.createPayment, validationHandler, Controller.createPayment);

router.put("/:id/payments/:paymentId", authFor("editPayment:purchasesReturn"), validation.updatePayment, validationHandler, Controller.updatePayment);

router.delete("/:id/payments/:paymentId", authFor("deletePayment:purchasesReturn"), validation.deletePayment, validationHandler, Controller.deletePayment);

module.exports = router;
