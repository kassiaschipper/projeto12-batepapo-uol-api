import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dotenv from "dotenv";
dotenv.config();

const userSchema = joi.object({
  name: joi.string().required(),
});

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("bate-papo-uol");
});

server.get("/participants", async (request, response) => {
  try {
    const participantsResponse = await db
      .collection("participants")
      .find()
      .toArray();
    response.send(
      participantsResponse.map((value) => ({
        ...value,
        _id: undefined,
      }))
    );
  } catch (error) {
    console.log(error);
    response.sendStatus(500);
  }
});

server.post("/participants", async (request, response) => {
  const { name } = request.body;

  const validation = userSchema.validate({ name }, { abortEarly: false });

  if (validation.error) {
    response.sendStatus(422);
    return;
  }

  //Verificar se o nome já foi usado
  //const repeatedName = db.collection("participants").findOne(name);
  try {
    const participantsResponse = await db
      .collection("participants")
      .insertOne({ name });
    response.sendStatus(201);
  } catch (error) {
    console.log(error);
    response.sendStatus(500);
  }
});

server.listen(5000, function () {
  console.log("Listening on Port 5000");
});
