const {
  ScanCommand,
  ListTablesCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");
const dynamodbClient = require("./db.config");
const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const AWS = require("aws-sdk");
const bcrypt = require("bcrypt");

const scanTable = async (tableName) => {
  const params = {
    TableName: tableName,
  };
  try {
    const data = await dynamodbClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    return err;
  }
};

const getTableInfo = async (tableName) => {
  const params = { TableName: "breakfast" };
  try {
    const data = await dynamodbClient.send(new DescribeTableCommand(params));
    console.log("Success", data);
    return data;
  } catch (err) {
    console.log("Error", err);
  }
};

const listTables = async () => {
  try {
    const data = await dynamodbClient.send(new ListTablesCommand({}));
    return data.TableNames;
  } catch (err) {
    console.error(err);
  }
};

const addUser = async (userDetails) => {
  let usersData = await scanTable("users");
  usersData = usersData.map((user) => {
    return AWS.DynamoDB.Converter.unmarshall(user);
  });

  const userExists = usersData?.find((user) => {
    return user.email === userDetails.email;
  });

  try {
    if (!userExists) {
      const hashedPassword = await bcrypt.hash(userDetails.password, 11);
      const params = {
        TableName: "users",
        Item: {
          user_id: uuid(),
          username: userDetails.username,
          email: userDetails.email,
          password: hashedPassword,
          orders: [],
        },
      };
      const data = await dynamodbClient.send(new PutCommand(params));
      return data;
    } else {
      throw { err: "User with this email already exists" };
    }
  } catch (err) {
    console.error(err);
    return err;
  }
};

const getAllRestaurants = async () => {
  const params = {
    TableName: "Restaurants",
  };
  try {
    const data = await dynamodbClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    return err;
  }
};

const getRestaurantByID = async (res_id) => {
  const params = {
    TableName: "Restaurants",
    Key: {
      res_id: res_id,
    },
  };
  try {
    const data = await dynamodbClient.send(new GetCommand(params));
    return data.Item;
  } catch (err) {
    return err;
  }
};

module.exports = {
  scanTable,
  listTables,
  getTableInfo,
  getAllRestaurants,
  getRestaurantByID,
  addUser,
};
