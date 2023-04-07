const {
  ScanCommand,
  UpdateItemCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const dynamodbClient = require("./db.config");
const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuid } = require("uuid");
const AWS = require("aws-sdk");
const bcrypt = require("bcrypt");
const sgMail = require("@sendgrid/mail");

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
          cart: [],
          isLoggedIn: true,
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

const checkUser = async (userDetails) => {
  let usersData = await scanTable("users");
  usersData = usersData.map((user) => {
    return AWS.DynamoDB.Converter.unmarshall(user);
  });

  const userExists = usersData?.find((user) => {
    return user.email === userDetails.email;
  });

  if (!userExists) {
    return false;
  } else {
    const result = await bcrypt.compare(
      userDetails.password,
      userExists.password
    );
    if (result) {
      const params = {
        TableName: "users",
        Key: { email: { S: userDetails.email } },
        UpdateExpression: "SET isLoggedIn = :val",
        ExpressionAttributeValues: {
          ":val": { BOOL: true },
        },
      };

      // Execute the updateItem command
      try {
        const data = await dynamodbClient.send(new UpdateItemCommand(params));
      } catch (err) {
        console.error(err);
      }
      return result;
    }
  }
};

const logoutUser = async (userData) => {
  const params = {
    TableName: "users",
    Key: { email: { S: userData.email } },
    UpdateExpression: "SET isLoggedIn = :val",
    ExpressionAttributeValues: {
      ":val": { BOOL: false },
    },
  };

  // Execute the updateItem command
  try {
    const data = await dynamodbClient.send(new UpdateItemCommand(params));
  } catch (err) {
    console.error(err);
  }
  return true;
};

const isLoggedIn = async (userData) => {
  const params = {
    TableName: "users",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": { S: userData.email },
    },
  };

  try {
    let data = await dynamodbClient.send(new QueryCommand(params));
    data = AWS.DynamoDB.Converter.unmarshall(data.Items[0]);
    if (data.isLoggedIn) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
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

const addCartItem = async (cart) => {};

const addOrder = async (data) => {
  const currentDate = new Date();

  const dateTime =
    currentDate.getDate() +
    "/" +
    (currentDate.getMonth() + 1) +
    "/" +
    currentDate.getFullYear() +
    " @ " +
    currentDate.getHours() +
    ":" +
    currentDate.getMinutes() +
    ":" +
    currentDate.getSeconds();

  console.log(dateTime);

  const cart_items = data.cart.cart_items;

  let total = 0;
  cart_items.forEach((item) => {
    console.log(item);
    total += item.item_price * item.item_qty;
  });

  const params = {
    TableName: "users",
    Key: {
      email: { S: data.email },
    },
    UpdateExpression:
      "SET #orders = list_append(if_not_exists(#orders, :empty_list), :new_order)",
    ExpressionAttributeNames: {
      "#orders": "orders",
    },
    ExpressionAttributeValues: {
      ":empty_list": { L: [] },
      ":new_order": {
        L: [
          {
            M: {
              orderId: { S: uuid() },
              orderDate: { S: dateTime },
              orderTotal: { N: total.toString() },
              res_id: { S: data.cart.res_id },
              res_name: { S: data.cart.res_name },
              order_items: {
                L: cart_items.map((item) => ({
                  M: {
                    item_name: { S: item.item_name },
                    item_qty: { N: item.item_qty.toString() },
                    item_price: { N: item.item_price.toString() },
                  },
                })),
              },
            },
          },
        ],
      },
    },
  };

  const result = await dynamodbClient.send(new UpdateItemCommand(params));
  if (result.$metadata.httpStatusCode === 200) {
    // send payment reciept
    sendEmail(data.email);
  } else {
    return false;
  }
};

const getOrders = async (data) => {
  const email = data.email;
  const params = {
    TableName: "users",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": { S: email },
    },
    ProjectionExpression: "orders",
  };

  try {
    const result = await dynamodbClient.send(new QueryCommand(params));
    if (result.Items.length === 0) {
      console.log("No orders found for user:", email);
      return [];
    } else {
      const data = AWS.DynamoDB.Converter.unmarshall(result.Items[0]);
      console.log(data.orders);
      return data.orders;
    }
  } catch (err) {
    console.error(err);
  }
  return null;
};

const sendEmail = async (email) => {
  const recieptHtml = `<table>
  <tr>
    <th>Item Name</th>
    <th>Quantity</th>
    <th>Price</th>
  </tr>
  <tr>
    <td>Item 1</td>
    <td>2</td>
    <td>$5.00</td>
  </tr>
  <tr>
    <td>Item 2</td>
    <td>1</td>
    <td>$10.00</td>
  </tr>
  <tr>
    <td>Item 3</td>
    <td>3</td>
    <td>$3.00</td>
  </tr>
  <tr>
    <td colspan="2" class="total">Total</td>
    <td>$21.00</td>
  </tr>
</table>`;

  const secret_name = "sendgrid_api_key";

  const client = new SecretsManagerClient({
    region: "us-east-1",
  });

  const getSecret = async () => {
    try {
      const response = await client.send(
        new GetSecretValueCommand({
          SecretId: secret_name,
          VersionStage: "AWSCURRENT",
        })
      );
      const secret = response.SecretString;
      return JSON.parse(secret);
    } catch (error) {
      throw error;
    }
  };

  const secret = await getSecret();
  console.log(email);

  sgMail.setApiKey(secret.SENDGRID_API_KEY);
  const msg = {
    to: email,
    from: "jaykania232@gmail.com", // Use the email address or domain you verified above
    subject: "Payment Reciept of your current order",
    text: "and easy to do anywhere, even with Node.js",
    html: recieptHtml,
  };
  //ES6
  sgMail.send(msg).then(
    () => {},
    (error) => {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  );
};

module.exports = {
  scanTable,
  getAllRestaurants,
  getRestaurantByID,
  addUser,
  checkUser,
  logoutUser,
  isLoggedIn,
  addOrder,
  getOrders,
};
