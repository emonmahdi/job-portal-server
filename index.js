const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
require('dotenv').config()

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e5zetpl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri);

app.get("/", (req, res) => {
  res.send("Job Portal Application server");
});

async function jobServer() {
  try {
    const database = client.db("job_portal");
    const userCollection = database.collection("user");

    // post api
    app.post("/user", async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);

      res.send(result);
    });

    console.log("mongodb connection successfully!");
  } finally {
    // await client.close();
  }
}
jobServer().catch(console.dir);

app.listen(port, function () {
  console.log("Running the server.......", port);
});
