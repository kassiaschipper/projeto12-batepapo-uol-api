import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

//console.log(process.env.TESTE, process.env.MONGO_URI)
const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("bate-papo-uol");
});


server.get("/participants", (request, response) => {
    db.collection("participants").find().toArray().then((data) => {
        response.send(data.map(value => ({ //não pegar o _id
            ...value,
            _id: undefined,
        })));
    })
})

server.post("/participants", (request, response) => {

     const { name } = request.body;

     //mudar para validação com Joi
    if(!name || typeof(name) !== "string" || name.length === 0){
       return response.sendStatus(422);
    }
   
    
    //Verificar se o nome já foi usado
    //const repeatedName = db.collection("participants").findOne(name); 

     db.collection("participants").insertOne({ name }).then(() =>{
        // console.log(name);
        // if(repeatedName){
        //     console.log("nome repetido")
        //     response.sendStatus(409);
        // }
        response.sendStatus(201);
    });

})


server.listen(5000, function () {
  console.log("Listening on Port 5000");
});
