const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const {
  scanTable,
  getAllRestaurants,
  getRestaurantByID,
  addUser,
} = require("./db");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

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
  // restaurant_detial = AWS.DynamoDB.Converter.unmarshall(restaurant_detial);
  res.send(restaurant_detial);
});

app.post("/users", async (req, res) => {
  const data = req.body;
  let result = await addUser(data);
  if (result.err) {
    return res.status(400).send({
      message: result.err,
    });
  }
  return res.status(200).send(result);
});

app.listen(4000, () => {
  console.log("Listening on port 4000");
});
