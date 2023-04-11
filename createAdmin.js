const bcrypt = require("bcrypt");
const dynamodbClient = require("./db.config");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuid } = require("uuid");

const addAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("Admin@123", 11);
    const params = {
      TableName: "admin",
      Item: {
        admin_id: uuid(),
        email: "admin@gmail.com",
        password: hashedPassword,
      },
    };
    const data = await dynamodbClient.send(new PutCommand(params));
    return data;
  } catch (err) {
    console.error(err);
    return err;
  }
};

module.exports = addAdmin;
