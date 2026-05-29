const mongoose = require("mongoose");
require("dotenv").config();

const models = require("../modelData/models.js");

const User = require("../db/userModel.js");
const Photo = require("../db/photoModel.js");
const SchemaInfo = require("../db/schemaInfo.js");

const versionString = "1.0";
const mongoUri = process.env.DB_URL || process.env.MONGO_URI;

async function dbLoad() {
  if (!mongoUri) {
    throw new Error("Missing MongoDB connection string. Add DB_URL=... to your .env file.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (error) {
    console.log("Unable connecting to MongoDB Atlas!");
    console.error(error.message);
    process.exit(1);
  }

  await User.deleteMany({});
  await Photo.deleteMany({});
  await SchemaInfo.deleteMany({});

  const userModels = models.userListModel();
  const mapFakeId2RealId = {};

  for (const user of userModels) {
    const userObj = new User({
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
      login_name: (user.first_name || "user").toLowerCase(),
      password: "pass",
    });

    try {
      await userObj.save();
      mapFakeId2RealId[user._id] = userObj._id;
      user.objectID = userObj._id;
      console.log(
        "Adding user:",
        `${user.first_name} ${user.last_name}`,
        "with ID",
        user.objectID.toString(),
      );
    } catch (error) {
      console.error("Error creating user", error.message);
    }
  }

  const photoModels = [];
  Object.keys(mapFakeId2RealId).forEach((id) => {
    photoModels.push(...models.photoOfUserModel(id));
  });

  for (const photo of photoModels) {
    const photoObj = await Photo.create({
      file_name: photo.file_name,
      date_time: photo.date_time,
      user_id: mapFakeId2RealId[photo.user_id],
      comments: [],
    });

    photo.objectID = photoObj._id;

    if (photo.comments) {
      photo.comments.forEach((comment) => {
        photoObj.comments.push({
          comment: comment.comment,
          date_time: comment.date_time,
          user_id: comment.user.objectID,
        });
        console.log(
          "Adding comment of length %d by user %s to photo %s",
          comment.comment.length,
          comment.user.objectID.toString(),
          photo.file_name,
        );
      });
    }

    try {
      await photoObj.save();
      console.log(
        "Adding photo:",
        photo.file_name,
        "of user ID",
        photoObj.user_id.toString(),
      );
    } catch (error) {
      console.error("Error creating photo", error.message);
    }
  }

  try {
    const schemaInfo = await SchemaInfo.create({
      version: versionString,
    });
    console.log("SchemaInfo object created with version", schemaInfo.version);
  } catch (error) {
    console.error("Error creating schemaInfo", error.message);
  }

  await mongoose.disconnect();
  console.log("Database load complete.");
}

 dbLoad().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
