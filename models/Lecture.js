import mongoose from "mongoose";

const Schema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    video: {
        type: String,
        required: true,
    },
    Course: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Courses",
         required: true,
    },
    CreatedAt: {
        type: Date,
        default: Date.now,
    },
});

export const Lecture = mongoose.model("Lecture",Schema);