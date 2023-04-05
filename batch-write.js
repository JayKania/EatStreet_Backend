const fs = require("fs");
const dynamodbClient = require("./db.config");
const { BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { ListTablesCommand } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();

const writeData = async () => {
  const allData = JSON.parse(
    fs.readFileSync("./data/restaurants.json", "utf8")
  );

  try {
    const { TableNames } = await dynamodbClient.send(new ListTablesCommand({}));

    const tableExists = TableNames.filter((table) => {
      return table === "Restaurants";
    });

    if (tableExists) {
      // Loop batch write operation to upload items
      const TABLE_NAME = "Restaurants";

      for (let j = 0; j < allData.length; j++) {
        const params = {
          RequestItems: {
            [TABLE_NAME]: [
              {
                // Destination Amazon DynamoDB table name.
                PutRequest: {
                  Item: {
                    res_id: uuidv4(),
                    res_name: allData[j].res_name,
                    res_location: allData[j].res_location,
                    res_cusines: allData[j].res_cusines,
                    res_img: `${process.env.CLOUD_FRONT_URL}/res_img${
                      j + 1
                    }.jpeg`,
                    breakfast_menu: allData[j].breakfast_menu,
                    soups_menu: allData[j].soups_menu,
                    pasta_menu: allData[j].pasta_menu,
                    sushi_menu: allData[j].sushi_menu,
                    maincourse_menu: allData[j].maincourse_menu,
                    deserts_menu: allData[j].deserts_menu,
                    drinks_menu: allData[j].drinks_menu,
                    alcohol_menu: allData[j].alcohol_menu,
                  },
                },
              },
            ],
          },
        };
        dynamodbClient.send(new BatchWriteCommand(params));
      }
    }
  } catch (error) {
    console.log("Error", error);
  }
};

module.exports = writeData;
