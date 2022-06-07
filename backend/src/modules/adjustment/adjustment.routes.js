const express = require("express");

const router = express.Router();

const { authFor, isAuth } = require("../../middlewares/auth.guard");

const Controller = require("./AdjustmentController");

const validation = require("./adjustment.validations");

const validationHandler = require("../../middlewares/validationHandler");

const generateStatusRoutes = require("../status/status.service");

generateStatusRoutes({
    router,
    module: {
        name: "adjustments",
        middlewares: {
            get: isAuth,
            create: authFor("createStatus:adjustments"),
            update: authFor("editStatus:adjustments"),
            remove: authFor("deleteStatus:adjustments"),
            changeEffectedStatus: authFor("changeEffectedStatus:adjustments")
        }
    }
});

router.get("/", authFor("read:adjustments"), validation.getAdjustments, Controller.getAdjustments);

router.post("/", authFor("create:adjustments"), validation.createAdjustment, validationHandler, Controller.createAdjustment);

router.get("/:id", authFor("show:adjustments"), validation.getAdjustment, validationHandler, Controller.getAdjustment);

router.get("/:id/edit", authFor("edit:adjustments"), validation.getEditAdjustment, validationHandler, Controller.getEditAdjustment);

router.put("/:id", authFor("edit:adjustments"), validation.updateAdjustment, validationHandler, Controller.updateAdjustment);

router.post("/:id/change-status", authFor("edit:adjustments"), validation.changeAdjustmentStatus, validationHandler, Controller.changeAdjustmentStatus);

router.delete("/:id", authFor("delete:adjustments"), validation.deleteAdjustment, validationHandler, Controller.deleteAdjustment);

module.exports = router;
