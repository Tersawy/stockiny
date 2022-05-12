const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./SaleReturnController");

const validation = require("./saleReturn.validations");

const validationHandler = require("../../middlewares/validationHandler");

const generateStatusRoutes = require("../status/status.service");

generateStatusRoutes({
    router,
    module: {
        name: "salesReturn",
        middlewares: {
            get: isAuth,
            create: authFor("createStatus:salesReturn"),
            update: authFor("editStatus:salesReturn"),
            remove: authFor("deleteStatus:salesReturn"),
            changeEffectedStatus: authFor("changeEffectedStatus:salesReturn")
        }
    }
});

router.get("/", authFor("read:salesReturn"), validation.getSalesReturn, Controller.getSalesReturn);

router.post("/", authFor("create:salesReturn"), validation.createSaleReturn, validationHandler, Controller.createSaleReturn);

router.get("/:id", authFor("show:salesReturn"), validation.getSaleReturn, validationHandler, Controller.getSaleReturn);

/* Get SaleReturn To Edit */
router.get("/:id/edit", authFor("edit:salesReturn"), validation.getEditSaleReturn, validationHandler, Controller.getEditSaleReturn);

router.put("/:id", authFor("edit:salesReturn"), validation.updateSaleReturn, validationHandler, Controller.updateSaleReturn);

router.post("/:id/change-status", authFor("edit:salesReturn"), validation.changeSaleReturnStatus, validationHandler, Controller.changeSaleReturnStatus);

router.delete("/:id", authFor("delete:salesReturn"), validation.deleteSaleReturn, validationHandler, Controller.deleteSaleReturn);

router.get("/:id/payments", authFor("showPayment:salesReturn"), validation.getPayments, validationHandler, Controller.getPayments);

router.post("/:id/payments", authFor("createPayment:salesReturn"), validation.createPayment, validationHandler, Controller.createPayment);

router.put("/:id/payments/:paymentId", authFor("editPayment:salesReturn"), validation.updatePayment, validationHandler, Controller.updatePayment);

router.delete("/:id/payments/:paymentId", authFor("deletePayment:salesReturn"), validation.deletePayment, validationHandler, Controller.deletePayment);

module.exports = router;
