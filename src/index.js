import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import dotenv from "dotenv";
dotenv.config();

const userSchema = joi.object({
  name: joi.string().required().min(1),
});

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("bate-papo-uol");
});


// #Rota participants
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
    response.sendStatus(500);
  }
});

server.post("/participants", async (request, response) => {
  const { name } = request.body;

  const validation = userSchema.validate({ name });
  //retorna uma array vazia se o nome ainda não existir ou uma array contendo name
  const filterName = await db
    .collection("participants")
    .find({ name })
    .toArray();

  //valida se o nome é uma string e se não é vazio
  if (validation.error) {
    response.status(422).send("Preencha o campo corretamente");
    return;
  }
  //Verifica se o nome passado já existe no db
  //Se o tamanho da array for mair que 0 significa que o nome já existe
  if (filterName.length > 0) {
    response.status(409).send("Usuário já existente");
    return;
  }

  try {
    const participantsResponse = await db
      .collection("participants")
      .insertOne({ name, lastStatus: Date.now() });
    const message = await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().locale("pt-br").format("HH:mm:ss"),
    });
    response.sendStatus(201);
    
  } catch (error) {
    console.log(error)
    response.sendStatus(500);
  }
});

server.listen(5000, function () {
  console.log("Listening on Port 5000");
});
