import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app=express();

app.use(cors({  // Cross Origin Resourse Allocation
    origin: process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));
app.use(express.static("public"))
app.use(cookieParser());;

// Routes Import
import userRouter from "./routes/user.routes.js";

// Routes Declaration
app.use("/api/v1/users", userRouter);
// https://localhost:8000/api/v1/users/register

app.on("error", (error)=>{
    console.log("Error: ",error);
    throw error;
})

export {app}