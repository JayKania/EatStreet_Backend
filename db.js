const {
  ScanCommand,
  ListTablesCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");
const dynamodbClient = require("./db.config");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const fs = require("fs");

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

const getAllRestaurants = async () => {
  const params = {
    TableName: "restaurants",
  };
  try {
    const data = await dynamodbClient.send(new ScanCommand(params));
    return data.Items;
  } catch (err) {
    return err;
  }
};

// const getAllRestaurants = async () => {
//   const allData = await JSON.parse(
//     fs.readFileSync("./data/restaurants.json", "utf8")
//   );
//   console.log(allData);
//   return allData;
// };

const getRestaurantByID = async (res_id) => {
  const params = {
    TableName: "restaurants",
    Key: {
      res_id: res_id,
    },
  };
  try {
    const data = await dynamodbClient.send(new GetCommand(params));
    console.log(data.Item);
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
};
