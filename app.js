const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const {
  scanTable,
  getAllRestaurants,
  getRestaurantByID,
  addUser,
  checkUser,
  logoutUser,
  isLoggedIn,
  addOrder,
  getOrders,
} = require("./db");
const writeData = require("./batch-write");
const uploadImages = require("./upload-images");

const app = express();
app.use(express.json());
app.use(cors());

// writing initial data to the restaurants table and upload images for the same
// writeData();
// uploadImages();

const port = process.env.PORT || 5000;

app.get("/test", async (req, res) => {
  res.status(200).send("Working!");
});

app.get("/menu/:category", async (req, res) => {
  let menuItems = await scanTable(req.params.category);
  menuItems = menuItems.map((item) => {
    let unmarshalledItem = AWS.DynamoDB.Converter.unmarshall(item);
    return unmarshalledItem;
  });
  res.send(menuItems);
});

app.get("/restaurants", async (req, res) => {
  let restaurants = await getAllRestaurants();
  restaurants = restaurants.map((item) => {
    let unmarshalledItem = AWS.DynamoDB.Converter.unmarshall(item);
    return unmarshalledItem;
  });
  res.send(restaurants);
});

app.get("/restaurants/:res_id", async (req, res) => {
  const res_id = req.params.res_id;
  let restaurant_detial = await getRestaurantByID(res_id);
  res.send(restaurant_detial);
});

app.post("/signup", async (req, res) => {
  const data = req.body;
  let result = await addUser(data);
  if (result.err) {
    return res.status(400).send({
      message: result.err,
    });
  }
  return res.status(200).send(result);
});

app.post("/login", async (req, res) => {
  const data = req.body;
  let result = await checkUser(data);
  if (!result) {
    return res.status(400).send({ message: "Invalid email or password" });
  }
  return res.status(200).send();
});

app.post("/logout", async (req, res) => {
  const data = req.body;
  let result = await logoutUser(data);
  if (!result) {
    return res.status(400).send({ message: "Invalid email!" });
  }
  return res.status(200).send();
});

app.post("/loggedin", async (req, res) => {
  const data = req.body;
  let result = await isLoggedIn(data);
  return res.status(200).send({ isLoggedIn: result });
});

app.post("/order", async (req, res) => {
  const data = req.body;
  console.log(data);
  const result = await addOrder(data);
  if (result) {
    return res.status(200).send();
  } else {
    return res.status(500).send({ message: "Internal Server Error!" });
  }
});

app.post("/orders", async (req, res) => {
  const data = req.body;
  const result = await getOrders(data);
  if (result) {
    return res.status(200).send({
      orders: [...result],
    });
  } else {
    return res.status(500).send({ message: "Internal Server Error!" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
