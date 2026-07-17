import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "user",
    },
    mainrole:{
        type: String,
        default: "user",
    },
    subscription:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Courses",
         },
    ],
    resetPasswordExpire: Date,
},{
    timestamps: true,
});

const User = mongoose.models.User || mongoose.model("User", schema);

export { User };
export default User;