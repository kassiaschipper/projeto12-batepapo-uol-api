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
    response.send("Preencha o campo corretamente").status(422);
    return;
  }
  //Verifica se o nome passado já existe no db
  //Se o tamanho da array for mair que 0 significa que o nome já existe 
  if (filterName.length > 0) {  
    response.send("Usuário já existente").status(409);
    return;
  }

  try {
    const participantsResponse = await db
      .collection("participants")
      .insertOne({ name });
    response.sendStatus(201);
  } catch (error) {
    response.sendStatus(500);
  }
});

server.listen(5000, function () {
  console.log("Listening on Port 5000");
});
