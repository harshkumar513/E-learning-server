import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { User } from "../models/User.js";
import fs from "fs";
import { rm } from "fs";
import { promisify } from "util";
import cloudinary from "../middlewares/cloudinary.js";

const unlinkAsync = promisify(fs.unlink);

// Create Course
export const createCourse = TryCatch(async (req, res) => {
  const { title, description, category, createdBy, duration, price } = req.body;

  const image = req.files && Object.values(req.files)[0];

  if (!image) {
    return res.status(400).json({
      message: "Course image is required",
    });
  }

  const cloud = await cloudinary.uploader.upload(image.tempFilePath, {
    resource_type: "image",
  });

  await unlinkAsync(image.tempFilePath);

  await Courses.create({
    title,
    description,
    category,
    createdBy,
    image: cloud.secure_url,
    duration,
    price,
  });

  res.status(201).json({
    message: "Course Created Successfully",
  });
});

// Add Lecture
export const addLecture = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      message: "No Course with this id",
    });
  }

  const { title, description } = req.body;
  const file = req.files && Object.values(req.files)[0];

  if (!file) {
    return res.status(400).json({
      message: "Lecture video is required",
    });
  }

  const cloud = await cloudinary.uploader.upload(file.tempFilePath, {
    resource_type: "video",
  });

  await unlinkAsync(file.tempFilePath);

  const lecture = await Lecture.create({
    title,
    description,
    video: cloud.secure_url,
    course: course._id,
  });

  res.status(201).json({
    message: "Lecture Added",
    lecture,
  });
});

// Delete Lecture
export const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);

  if (!lecture) {
    return res.status(404).json({
      message: "Lecture not found",
    });
  }

  if (lecture.video && fs.existsSync(lecture.video)) {
    await unlinkAsync(lecture.video);
  }

  await lecture.deleteOne();

  res.json({
    message: "Lecture Deleted",
  });
});

// Delete Course
export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  if (!course) {
    return res.status(404).json({
      message: "Course not found",
    });
  }

  const lectures = await Lecture.find({
    Course: course._id,
  });

  await Promise.all(
    lectures.map(async (lecture) => {
      if (lecture.video && fs.existsSync(lecture.video)) {
        await unlinkAsync(lecture.video);
      }
    })
  );

  if (course.image && fs.existsSync(course.image)) {
    await unlinkAsync(course.image);
  }

  await Lecture.deleteMany({
    Course: course._id,
  });

  await course.deleteOne();

  await User.updateMany(
    {},
    {
      $pull: {
        subscription: course._id,
      },
    }
  );

  res.json({
    message: "Course Deleted Successfully",
  });
});

// Stats
export const getAllStats = TryCatch(async (req, res) => {
  const totalCourses = await Courses.countDocuments();
  const totalLectures = await Lecture.countDocuments();
  const totalUsers = await User.countDocuments();

  res.json({
    stats: {
      totalCourses,
      totalLectures,
      totalUsers,
    },
  });
});

// Users
export const getAllUsers = TryCatch(async (req, res) => {
  const users = await User.find({
    _id: {
      $ne: req.user._id,
    },
  }).select("-password");

  res.json({
    users,
  });
});

// Update Role
export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin") {
    return res.status(403).json({
      message: "Only Super Admin can update role",
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  user.role = user.role === "admin" ? "user" : "admin";

  await user.save();

  res.json({
    message: `Role updated to ${user.role}`,
  });
});