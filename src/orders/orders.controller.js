const path = require("path");
const ordersData = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");
const notFound = require("../errors/notFound");

// Middleware to check if the order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = ordersData.find((order) => order.id === orderId);

  if (foundOrder) {
    // All data passed between middleware and handler functions uses response.locals.
    res.locals.order = foundOrder; // Set the initial value for res.locals.order
    return next();
  }

  next({ status: 404, message: `Order not found: ${orderId}` });
}

// Middleware for validating order properties
function validateOrderProperties(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    return res.status(400).json({ error: "Order must include a deliverTo" });
  }

  if (!mobileNumber || mobileNumber === "") {
    return res.status(400).json({ error: "Order must include a mobileNumber" });
  }

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return res
      .status(400)
      .json({ error: "Order must include at least one dish" });
  }

  for (let index = 0; index < dishes.length; index++) {
    const { quantity } = dishes[index];

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        error: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  // If all validations pass, move to the next middleware/handler
  next();
}

// Middleware for extra status checks
function updateChecks(req, res, next) {
  //   const { data: { status } = {} } = req.body;
  //   if (!status || status === "" || status.toLowerCase() === "invalid") {
  //     return res.status(400).json({ error: "Order must have a valid status" });
  //   }
}

// Middleware for validating update properties
function validateUpdateProperties(req, res, next) {
  const { data: { id, status } = {} } = req.body;
  const { orderId } = req.params;

  if (id && id !== orderId) {
    return res.status(400).json({
      error: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }

  if (
    !status ||
    status === "" ||
    !["pending", "preparing", "out-for-delivery", "delivered"].includes(
      status.toLowerCase()
    )
  ) {
    return res.status(400).json({
      error:
        "Order must have a valid status of pending, preparing, out-for-delivery, delivered",
    });
  }

  next();
}

// Handler for listing all orders
function list(req, res) {
  res.json({ data: ordersData });
}

// Handler for creating a new order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: status || "pending",
    dishes,
  };

  ordersData.push(newOrder);

  res.status(201).json({ data: newOrder });
}

// Handler for reading a specific order
function read(req, res) {
  res.json({ data: res.locals.order });
}

// Handler for updating a specific order
function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const { orderId } = req.params;

  if (order.id !== orderId) {
    return res.status(400).json({ data: undefined });
  }

  // Update order properties
  // Excluding Id here to ensure it will not be overwritten by update handler
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

// Handler for deleting a specific order
function remove(req, res) {
  const order = res.locals.order;

  if (order.status !== "pending") {
    return res
      .status(400)
      .json({ error: "An order cannot be deleted unless it is pending" });
  }

  const index = ordersData.indexOf(order);
  ordersData.splice(index, 1);

  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateOrderProperties, create],
  read: [orderExists, read],
  update: [
    orderExists,
    validateOrderProperties,
    validateUpdateProperties,
    update,
  ],
  remove: [orderExists, remove],
};
