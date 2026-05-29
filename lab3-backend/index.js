const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dbConnect = require("./db/dbConnect");
const User = require("./db/userModel");
const Photo = require("./db/photoModel");
const SchemaInfo = require("./db/schemaInfo");

const app = express();
const port = process.env.PORT || 8081;
const imagesDir = path.join(__dirname, "images");
fs.mkdirSync(imagesDir, { recursive: true });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/images", express.static(imagesDir));
app.use(session({ secret: process.env.SESSION_SECRET || "photo-sharing-secret", resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: "lax" } }));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagesDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

function isValidObjectId(id) { return mongoose.Types.ObjectId.isValid(id); }
function userSummary(user) { return { _id: user._id, first_name: user.first_name, last_name: user.last_name }; }
function authRequired(req, res, next) {
  if (!req.session.user_id) return res.status(401).send("Unauthorized");
  return next();
}

app.get("/", (_req, res) => res.send({ message: "Photo Sharing API" }));
app.get("/test/info", async (_req, res) => {
  const schemaInfo = await SchemaInfo.findOne({}, "_id version load_date_time").lean();
  res.status(200).send(schemaInfo);
});

app.get("/admin/user", async (req, res) => {
  if (!req.session.user_id) return res.status(401).send("Unauthorized");
  const user = await User.findById(req.session.user_id, "_id login_name first_name last_name").lean();
  if (!user) return res.status(401).send("Unauthorized");
  return res.status(200).send(user);
});

app.post("/admin/login", async (req, res) => {
  const { login_name, password } = req.body || {};
  if (!login_name) return res.status(400).send("Missing login_name");
  const user = await User.findOne({ login_name }, "_id login_name password first_name last_name").lean();
  if (!user || (user.password || "") !== (password || "")) return res.status(400).send("Invalid login name or password");
  req.session.user_id = user._id.toString();
  return res.status(200).send({ _id: user._id, login_name: user.login_name, first_name: user.first_name, last_name: user.last_name });
});

app.post("/admin/logout", (req, res) => {
  if (!req.session.user_id) return res.status(400).send("No user is currently logged in");
  req.session.destroy(() => res.status(200).send({ message: "Logged out" }));
});

app.post("/user", async (req, res) => {
  const { login_name, password, first_name, last_name, location = "", description = "", occupation = "" } = req.body || {};
  if (!login_name || !login_name.trim()) return res.status(400).send("login_name is required");
  if (!password || !password.trim()) return res.status(400).send("password is required");
  if (!first_name || !first_name.trim()) return res.status(400).send("first_name is required");
  if (!last_name || !last_name.trim()) return res.status(400).send("last_name is required");
  const exists = await User.findOne({ login_name }).lean();
  if (exists) return res.status(400).send("login_name already exists");
  const user = await User.create({ login_name, password, first_name, last_name, location, description, occupation });
  return res.status(200).send({ _id: user._id, login_name: user.login_name, first_name: user.first_name, last_name: user.last_name });
});

app.use(authRequired);

app.get("/user/list", async (_req, res) => {
  const users = await User.find({}, "_id first_name last_name occupation").sort({ first_name: 1 }).lean();
  res.status(200).send(users);
});

app.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).send(`Invalid user id: ${id}`);
  const user = await User.findById(id, "_id first_name last_name location description occupation").lean();
  if (!user) return res.status(400).send(`User not found: ${id}`);
  return res.status(200).send(user);
});

app.get("/photosOfUser/:id", async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).send(`Invalid user id: ${id}`);
  const user = await User.findById(id, "_id").lean();
  if (!user) return res.status(400).send(`User not found: ${id}`);
  const photos = await Photo.find({ user_id: id }, "_id user_id comments file_name date_time").sort({ date_time: 1 }).lean();
  const commentUserIds = [...new Set(photos.flatMap(p => (p.comments || []).map(c => c.user_id && c.user_id.toString()).filter(Boolean)))];
  const commentUsers = await User.find({ _id: { $in: commentUserIds } }, "_id first_name last_name").lean();
  const usersById = new Map(commentUsers.map(u => [u._id.toString(), userSummary(u)]));
  const responsePhotos = photos.map(photo => ({
    _id: photo._id, user_id: photo.user_id, file_name: photo.file_name, date_time: photo.date_time,
    comments: (photo.comments || []).map(c => ({ _id: c._id, comment: c.comment, date_time: c.date_time, user: usersById.get(c.user_id.toString()) }))
  }));
  res.status(200).send(responsePhotos);
});

app.post("/commentsOfPhoto/:photo_id", async (req, res) => {
  const { photo_id } = req.params;
  const text = (req.body && req.body.comment || "").trim();
  if (!text) return res.status(400).send("Comment cannot be empty");
  if (!isValidObjectId(photo_id)) return res.status(400).send("Invalid photo id");
  const photo = await Photo.findById(photo_id);
  if (!photo) return res.status(400).send("Photo not found");
  photo.comments.push({ comment: text, date_time: new Date(), user_id: req.session.user_id });
  await photo.save();
  return res.status(200).send({ message: "Comment added" });
});

app.post("/photos/new", upload.single("uploadedphoto"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const photo = await Photo.create({ file_name: req.file.filename, date_time: new Date(), user_id: req.session.user_id, comments: [] });
  return res.status(200).send(photo);
});

dbConnect().then(() => app.listen(port, () => console.log(`Server listening on port ${port}`))).catch(() => process.exit(1));
