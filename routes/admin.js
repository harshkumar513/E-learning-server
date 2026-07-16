import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import { addLecture, createCourse, deleteCourse, deleteLacture, getAllStats, getAllUsers, updateRole, } from "../controllers/admin.js";
import { uploadFiles} from "../middlewares/multer.js"

const routers = express.Router();

routers.post("/course/new", isAuth, isAdmin, uploadFiles, createCourse);
routers.post("/course/:id",isAuth, isAdmin, uploadFiles, addLecture);
routers.delete("/course/:id",isAuth, isAdmin, deleteCourse);
routers.delete("/lecture/:id", isAuth, isAdmin, deleteLacture);
routers.get('/stats', isAuth, isAdmin, getAllStats);
routers.put('/user/:id',isAuth, isAdmin, updateRole);
routers.get("/users",isAuth, isAdmin, getAllUsers);
export default routers;