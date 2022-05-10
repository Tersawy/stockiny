const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./SaleController");

const validation = require("./sale.validations");

const validationHandler = require("../../middlewares/validationHandler");

const generateStatusRoutes = require("../status/status.service");

generateStatusRoutes({
    router,
    module: {
        name: "sales",
        middlewares: {
            get: isAuth,
            create: authFor("createStatus:sales"),
            update: authFor("editStatus:sales"),
            remove: authFor("deleteStatus:sales"),
            changeEffectedStatus: authFor("changeEffectedStatus:sales")
        }
    }
});

router.get("/", authFor("read:sales"), validation.getSales, Controller.getSales);

router.post("/", authFor("create:sales"), validation.createSale, validationHandler, Controller.createSale);

router.get("/:id", authFor("show:sales"), validation.getSale, validationHandler, Controller.getSale);

/* Get Sale To Edit */
router.get("/:id/edit", authFor("edit:sales"), validation.getEditSale, validationHandler, Controller.getEditSale);

router.put("/:id", authFor("edit:sales"), validation.updateSale, validationHandler, Controller.updateSale);

router.post("/:id/change-status", authFor("edit:sales"), validation.changeSaleStatus, validationHandler, Controller.changeSaleStatus);

router.delete("/:id", authFor("delete:sales"), validation.deleteSale, validationHandler, Controller.deleteSale);

router.get("/:id/payments", authFor("showPayment:sales"), validation.getPayments, validationHandler, Controller.getPayments);

router.post("/:id/payments", authFor("createPayment:sales"), validation.createPayment, validationHandler, Controller.createPayment);

router.put("/:id/payments/:paymentId", authFor("editPayment:sales"), validation.updatePayment, validationHandler, Controller.updatePayment);

router.delete("/:id/payments/:paymentId", authFor("deletePayment:sales"), validation.deletePayment, validationHandler, Controller.deletePayment);

module.exports = router;
