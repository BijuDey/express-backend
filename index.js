const express = require("express");
require("dotenv").config();
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const User = require("./schema");
const { auth, verifyToken } = require("./jwt");
const { hashPassword, comparePassword } = require("./functions");

app.use(express.json());

mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/user", async (req, res) => {
  const data = await req.body;
  const user = new User(data);
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    res.status(409).send("User already exists");
  } else {
    const token = auth(data.email);
    user.password = await hashPassword(data.password);
    const result = await user.save();

    res.status(201).send({
      data: { userId: result._id, name: result?.name, email: result?.email },
      token,
    });
  }
});

app.post("/login", async (req, res) => {
  const data = await req.body;
  try {
    const user = await User.findOne({ email: data.email });
    if (user && (await comparePassword(data.password, user.password))) {
      const token = auth(data.email);
      res.send({
        message: "Login successful",
        token,
      });
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    res.status(500).send("Internal server error");
  }
});

app.get("/allUsers", async (req, res) => {
  verifyToken(res, req);
  const users = await User.find({}, { email: 1, name: 1, _id: 1 });
  if (users.length > 0) {
    res.send(users);
  } else {
    res.status(404).send("No users found");
  }
});

app.put("/user/:id", async (req, res) => {
  verifyToken(res, req);
  const id = req.params.id;
  const data = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      data: {
        name: updatedUser?.name,
        email: updatedUser?.email,
        userId: updatedUser?._id,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`);
});
