const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./TransferController");

const validation = require("./transfer.validations");

const validationHandler = require("../../middlewares/validationHandler");

const generateStatusRoutes = require("../status/status.service");

generateStatusRoutes({
    router,
    module: {
        name: "transfers",
        middlewares: {
            get: isAuth,
            create: authFor("createStatus:transfers"),
            update: authFor("editStatus:transfers"),
            remove: authFor("deleteStatus:transfers"),
            changeEffectedStatus: authFor("changeEffectedStatus:transfers")
        }
    }
});

router.get("/", authFor("read:transfers"), validation.getTransfers, Controller.getTransfers);

router.post("/", authFor("create:transfers"), validation.createTransfer, validationHandler, Controller.createTransfer);

router.get("/:id", authFor("show:transfers"), validation.getTransfer, validationHandler, Controller.getTransfer);

router.get("/:id/edit", authFor("edit:transfers"), validation.getEditTransfer, validationHandler, Controller.getEditTransfer);

router.put("/:id", authFor("edit:transfers"), validation.updateTransfer, validationHandler, Controller.updateTransfer);

router.post("/:id/change-status", authFor("edit:transfers"), validation.changeTransferStatus, validationHandler, Controller.changeTransferStatus);

router.delete("/:id", authFor("delete:transfers"), validation.deleteTransfer, validationHandler, Controller.deleteTransfer);

module.exports = router;
