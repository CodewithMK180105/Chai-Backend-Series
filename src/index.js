// require('dotenv').config({
//     path: './env'
// })


import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import { app } from "./app.js"

dotenv.config({path: './.env'});

const port=process.env.PORT || 8000;

connectDB()
.then(()=>{
    app.listen(port, ()=>{
        console.log(` Server is running at PORT: ${port}`);
    })
})
.catch((error)=>{

})

/*
import express from "express";
const app=express();

( async()=>{
    try{
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error)=>{
            console.log("Error: ",error);
            throw error;
        });
        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on the port number : ${process.env.PORT}`);
        })
    } catch(error){
        console.error("ERROR: ",error);
        throw error;
    }
})() // IIFE

*/