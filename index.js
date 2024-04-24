const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://chipper-sunflower-fc2ba2.netlify.app",
    ],
  })
);
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
    const jobCollection = database.collection("job");

    // post api
    app.post("/user", async (req, res) => {
      const user = req.body;

      const result = await userCollection.insertOne(user);

      res.send(result);
    });
    // user email api
    app.get("/user/:email", async (req, res) => {
      const email = req?.params?.email;
      // console.log(email);
      const result = await userCollection.findOne({ email });
      // console.log(result);
      if (result?.email) {
        return res.send({ status: true, data: result });
      }
      res.send({ status: false });
    });

    // job post api
    app.post("/job", async (req, res) => {
      const job = req.body;

      const result = await jobCollection.insertOne(job);

      res.send({ status: true, data: result });
    });

    // job get api
    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find({});
      const result = await cursor.toArray();

      res.send({ status: true, data: result });
    });

    // job get api
    app.get("/job/:id", async (req, res) => {
      const id = req.params.id;
      const result = await jobCollection.findOne({ _id: new ObjectId(id) });

      res.send({ status: true, data: result });
    });

    // apply patch api
    app.patch("/apply", async (req, res) => {
      const userId = req.body.userId;
      const jobId = req.body.jobId;
      const email = req.body.email;

      const filter = { _id: new ObjectId(jobId) };

      const updateDoc = {
        $push: { applicants: { id: new ObjectId(userId), email } },
      };
      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }
      res.send({ status: false });
    });

    //applied job api
    app.get("/applied-jobs/:email", async (req, res) => {
      const email = req?.params?.email;
      const query = { applicants: { $elemMatch: { email: email } } };
      const cursor = await jobCollection.find(query).project({ applicants: 0 });
      const result = await cursor.toArray();
      res.send({ status: true, data: result });
    });

    // query api
    app.patch("/query", async (req, res) => {
      const userId = req.body.userId;
      const jobId = req.body.jobId;
      const email = req.body.email;
      const question = req.body.question;

      const filter = { _id: new ObjectId(jobId) };
      const updateDoc = {
        $push: {
          queries: {
            id: new ObjectId(userId),
            email,
            question: question,
            reply: [],
          },
        },
      };

      const result = await jobCollection.updateOne(filter, updateDoc);

      if (result?.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
    });

    app.patch("/reply", async (req, res) => {
      const userId = req.body.userId;
      const reply = req.body.reply;
      console.log(reply);
      console.log(userId);

      const filter = { "queries.id": new ObjectId(userId) };

      const updateDoc = {
        $push: {
          "queries.$[user].reply": reply,
        },
      };
      const arrayFilter = {
        arrayFilters: [{ "user.id": new ObjectId(userId) }],
      };

      const result = await jobCollection.updateOne(
        filter,
        updateDoc,
        arrayFilter
      );
      if (result.acknowledged) {
        return res.send({ status: true, data: result });
      }

      res.send({ status: false });
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
