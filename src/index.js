import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb"; 
import dotenv from "dotenv";
dotenv.config();

const server = express();
server.use(cors());
server.use(express.json());

console.log(process.env.TESTE, process.env.MONGO_URI) 
const mongoClient = new MongoClient(process.env.MONGO_URI) 

server.listen(5000, function () {
    console.log("Listening on Port 5000");
})