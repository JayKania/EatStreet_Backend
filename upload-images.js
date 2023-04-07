const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();

const uploadImages = () => {
  // Array of image file paths
  const imagePaths = [
    "./res_images/res_img1.jpeg",
    "./res_images/res_img2.jpeg",
    "./res_images/res_img3.jpeg",
    "./res_images/res_img4.jpeg",
    "./res_images/res_img5.jpeg",
    "./res_images/res_img6.jpeg",
    "./res_images/res_img7.jpeg",
    "./res_images/res_img8.jpeg",
  ];

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  });

  // Upload each image to S3
  imagePaths.forEach((imagePath, index) => {
    // Read the image file into a buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // Set the S3 upload parameters
    const params = {
      Bucket: "application-bucket-jk",
      Key: `res_img${index + 1}.jpeg`,
      Body: imageBuffer,
    };

    // Upload the image to S3
    s3.putObject(params, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Successfully uploaded ${imagePath} to S3`);
      }
    });
  });
};

module.exports = uploadImages;
