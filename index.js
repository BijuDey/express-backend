const express = require("express");
require("dotenv").config();
const app = express();
const port = 3000;
const mongoose = require("mongoose");
const User = require("./schema");
const auth = require("./jwt");
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

    res.status(201).send({ result, token });
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

app.listen(port, () => {
  console.log(`App listening on port http://localhost:${port}`);
});
