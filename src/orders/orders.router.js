const router = require("express").Router();
const controller = require("./orders.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

// Route for reading, updating, and deleting a specific order by ID
router
  .route("/:orderId")
  .get(controller.read)
  .put(controller.update)
  .delete(controller.remove)
  .all(methodNotAllowed);

// Route for listing all orders
router
  .route("/")
  .get(controller.list)
  .post(controller.create)
  .all(methodNotAllowed);

module.exports = router;
