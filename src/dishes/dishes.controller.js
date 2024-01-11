const path = require("path");
const dishesData = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");
const notFound = require("../errors/notFound");

// Middleware to check if the dish exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishesData.find((dish) => dish.id === dishId);

  if (foundDish) {
    // All data passed between middleware and handler functions uses response.locals.
    res.locals.dish = foundDish; // Set the initial value for res.locals.dish
    return next();
  }

  next({ status: 404, message: `Dish not found: ${dishId}` });
}

// Middleware for validating dish properties
function validateDishProperties(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (!name || name === "") {
    return res.status(400).json({ error: "Dish must include a name" });
  }

  if (!description || description === "") {
    return res.status(400).json({ error: "Dish must include a description" });
  }

  if (!Number.isInteger(price) || price <= 0) {
    return res.status(400).json({
      error: "Dish must have a price that is an integer greater than 0",
    });
  }

  if (!image_url || image_url === "") {
    return res.status(400).json({ error: "Dish must include an image_url" });
  }

  // If all validations pass, move to the next middleware/handler

  next();
}

// Handler for listing all dishes
function list(req, res) {
  res.json({ data: dishesData });
}

// Handler for creating a new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishesData.push(newDish);

  res.status(201).json({ data: newDish });
}

// Handler for reading a specific dish
function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

// Handler for updating a specific dish
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const { dishId } = req.params;

  if (id && id !== dishId) {
    return res.status(400).json({
      error: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  // Update dish properties
  // Excluding Id here to ensure it will not be overwritten by update handler
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  create: [validateDishProperties, create],
  read: [dishExists, read],
  update: [dishExists, validateDishProperties, update],
};
