import express, { response } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import { stripHtml } from "string-strip-html";
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("bate-papo-uol");
});

const userSchema = joi.object({
  name: joi.string().required().min(1),
});

const messageSchema = joi.object({
  to: joi.string().required().min(1),
  text: joi.string().required().min(1),
  type: joi.required().valid("message", "private_message"),
});

setInterval(async () => {
  const participantsList = await db.collection("participants").find().toArray();
  console.log(participantsList)

  participantsList.forEach( async (value) => {  
    if (Date.now() - 10000 > Number(value.lastStatus)){
      await db.collection("participants").deleteOne(value);
      await db.collection("messages").insertOne({
        from: value.name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: dayjs().format("HH:mm:ss"),
      });
    }
  });
}, 15000);
//
// #Rota participants
server.get("/participants", async (request, response) => {
  try {
    const participantsResponse = await db
      .collection("participants")
      .find()
      .toArray();
    response.send(participantsResponse)
    //   participantsResponse.map((value) => ({
    //     ...value,
    //     _id: undefined,
    //   }))
    // );
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
    console.log(message);
    response.sendStatus(201);
  } catch (error) {
    //console.log(error);
    response.sendStatus(500);
  }
});

// #Rota messages
server.post("/messages", async (request, response) => {
  const { to, text, type } = request.body;
  const { user } = request.headers;

  const validation = messageSchema.validate({ to, text, type });

  const userFromValidation = await db
    .collection("participants")
    .findOne({ name: user });

  //console.log(userFromValidation)
  //verifica se o usuario de from existe
  if (userFromValidation === null) {
    response.sendStatus(422);
    return;
  }
  if (validation.error) {
    response.sendStatus(422);
    return;
  }

  try {
    const messagesResponse = await db.collection("messages").insertOne({
      from: user,
      to,
      text,
      type,
      time: dayjs().locale("pt-br").format("HH:mm:ss"),
    });
    response.sendStatus(201);
  } catch (error) {
    response.sendStatus(422);
  }
});

server.get("/messages", async (request, response) => {
  const { limit } = request.query;
  const { user } = request.headers;

  try {
    const messagesResponse = await db.collection("messages").find().toArray();
    const filterMessages = messagesResponse.filter(
      (value) =>
        value.from === user || value.to === "Todos" || value.to === user
    );

    if (!limit) {
      response.send(filterMessages);
    }

    response.send(filterMessages.slice(limit * -1)); //extrai os últimos elementos do array considerando o limite
  } catch (error) {
    response.sendStatus(400);
  }
});

//# Rota status
server.post("/status", async (request, response) => {
  const user = request.headers.user;

  try {
    const statusResponse = await db
      .collection("participants")
      .findOne({ name: user });
    //console.log(`statusResponse ${statusResponse}`);
    if (!statusResponse) {
      response.sendStatus(404);
      return;
    }
    const upadated = await db.collection("participants").updateOne(
      { name: user },
      {
        $set: {
          lastStatus: Date.now(),
        },
      }
    );
    console.log(`updated ${upadated}`);
    response.sendStatus(200);
  } catch (error) {
    response.sendStatus(500);
  }
});

server.delete("/messages/:messageId", async (request, response) => {
  const { messageId } = request.params;
  const  user  = request.headers.user;

  try {
      const deleteMessage = await db.collection("messages").findOne({ _id: new ObjectId(messageId)});
      if(!deleteMessage){
           response.sendStatus(404);
           return
      }
      if(deleteMessage.from !== user){
          response.sendStatus(401);
          return 
      }
      await db.collection("messages").deleteOne({ _id: new ObjectId(messageId)});
      response.sendStatus(200);
  } catch (error) {
     response.sendStatus(500);
  }
});

server.listen(5000, function () {
  console.log("Listening on Port 5000");
});
