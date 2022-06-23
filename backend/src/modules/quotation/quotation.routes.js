const express = require("express");

const router = express.Router();

const { authFor } = require("../../middlewares/auth.guard");

const Controller = require("./QuotationController");

const validation = require("./quotation.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.get("/", authFor("read:quotation"), validation.getQuotations, Controller.getQuotations);

router.post("/", authFor("create:quotation"), validation.createQuotation, validationHandler, Controller.createQuotation);

router.get("/:id", authFor("show:quotation"), validation.getQuotation, validationHandler, Controller.getQuotation);

router.get("/:id/edit", authFor("edit:quotation"), validation.getEditQuotation, validationHandler, Controller.getEditQuotation);

router.put("/:id", authFor("edit:quotation"), validation.updateQuotation, validationHandler, Controller.updateQuotation);

router.post("/:id/change-status", authFor("edit:quotation"), validation.changeQuotationStatus, validationHandler, Controller.changeQuotationStatus);

router.delete("/:id", authFor("delete:quotation"), validation.deleteQuotation, validationHandler, Controller.deleteQuotation);

router.get("/:id/payments", authFor("showPayment:quotation"), validation.getPayments, validationHandler, Controller.getPayments);

router.post("/:id/payments", authFor("createPayment:quotation"), validation.createPayment, validationHandler, Controller.createPayment);

router.put("/:id/payments/:paymentId", authFor("editPayment:quotation"), validation.updatePayment, validationHandler, Controller.updatePayment);

router.delete("/:id/payments/:paymentId", authFor("deletePayment:quotation"), validation.deletePayment, validationHandler, Controller.deletePayment);

module.exports = router;
