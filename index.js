import express from 'express';
import dotenv from "dotenv";
import connectDb from "./database/db.js";
import Razorpay from 'razorpay';
import cors from 'cors';
import fileUpload from "express-fileupload";
import os from "os";

dotenv.config();

export const instance = new Razorpay({
  key_id: process.env.Razorpay_Key,
  key_secret: process.env.Razorpay_Secret,   // <-- ye exact naam kya hai?
});
connectDb();

const app = express()

//using middlewares
app.use(express.json());
app.use(cors());
app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: os.tmpdir(),
    })
);

const port= process.env.PORT;

app.get('/', (req, res) => {
    res.send("Server is working");
}
);

app.use("/uploads",express.static("uploads"))

//importing routes
import userRoutes from './routes/user.js'
import courseRoutes from './routes/Course.js';
import adminRoutes from './routes/admin.js';
// import courseRoutes from './routes/Course.js'

//using routes
app.use("/api", userRoutes);
// app.use("/api", courseRoutes);
app.use("/api", adminRoutes);
app.use("/api", courseRoutes );

app.listen(port, ()=>{
    console.log(`server is running on http://localhost:${port}`);
}
);