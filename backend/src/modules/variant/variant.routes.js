const express = require("express");

const router = express.Router();

const { authForAny } = require("../../middlewares/auth.guard");

const Controller = require("./VariantController");

const validation = require("./variant.validations");

const validationHandler = require("../../middlewares/validationHandler");

router.post("/variants", authForAny("edit:products"), validation.create, validationHandler, Controller.create);

router.put("/variants/:id", authForAny("edit:products"), validation.update, validationHandler, Controller.update);

router.get("/variants/:id/stocks", authForAny("show:products"), validation.stocks, validationHandler, Controller.stocks);

router.post("/variants/:id/change-availability", authForAny("edit:products"), validation.changeAvailability, validationHandler, Controller.changeAvailability);

router.put("/variants/:id/change-images", authForAny("edit:products"), validation.changeImages, validationHandler, Controller.changeImages);

router.put("/variants/:id/change-default-image", authForAny("edit:products"), validation.changeDefaultImage, validationHandler, Controller.changeDefaultImage);

module.exports = router;
