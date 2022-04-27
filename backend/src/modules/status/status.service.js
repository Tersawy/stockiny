const Controller = require("./StatusController");

const { isAuth } = require("../../middlewares/auth.guard");

const validation = require("./status.validations");

const validationHandler = require("../../middlewares/validationHandler");

const generateStatusRoutes = ({ router, module }) => {
    const { name, middlewares: { get, create, update, remove, changeEffectedStatus } } = module;

    const invoiceMiddleware = (req, res, next) => {
        req.invoiceName = name;

        return next();
    };

    let makeArray = (value) => {
        if (Array.isArray(value)) return value;
        return value ? [value] : [isAuth];
    };

    router.get("/statuses", invoiceMiddleware, ...makeArray(get), Controller.getStatuses);

    router.post("/statuses", invoiceMiddleware, ...makeArray(create), validation.createStatus, validationHandler, Controller.createStatus);

    router.put("/statuses/:id", invoiceMiddleware, ...makeArray(update), validation.updateStatus, validationHandler, Controller.updateStatus);

    router.delete("/statuses/:id", invoiceMiddleware, ...makeArray(remove), validation.deleteStatus, validationHandler, Controller.deleteStatus);

    router.post("/statuses/:id/change-effected", invoiceMiddleware, ...makeArray(changeEffectedStatus), validation.changeEffectedStatus, validationHandler, Controller.changeEffectedStatus);
}

module.exports = generateStatusRoutes;