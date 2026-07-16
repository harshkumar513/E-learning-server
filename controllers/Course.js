import { instance } from "../index.js";
import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/user.js";
import crypto from 'crypto';


export const getAllCourses = TryCatch(async (req, res) => {
    const courses = await Courses.find();
    res.json({
        courses,
    });
});

export const getSingleCourse = TryCatch(async (req, res) => {
    const course = await Courses.findById(req.params.id);

    res.json({
        course,
    });
});

export const fetchLectures = TryCatch(async (req, res) => {
    // console.log("fetchLectures ")
    const lectures = await Lecture.find({
        Course: req.params.id, // ya course: req.params.id agar schema me lowercase hai
    });

    const user = await User.findById(req.user.id);
   

    if (user.role === "admin") {
        return res.json({ lectures });
    }

    if (!user.subscription.includes(req.params.id)) {
        return res.status(400).json({
            message: "You have not subscribed to this course",
        });
    }

    return res.json({ lectures });
});

// export const fetchLecture = TryCatch(async (req, res) => {
//     console.log("ID:", req.params.id);
//     const lecture = await Lecture.findById(req.params.id);
//     console.log(await Lecture.findById("6a50dce6d604d6c06f054d77"));
//     const lectures = await Lecture.find();

// console.log(lectures);

//     if (!lecture) {
//         return res.status(404).json({
//             message: "Lecture not found",
//         });
//     }

//     const user = await User.findById(req.user.id);

//     console.log("iiii");
//     console.log(req.params.id);

//     if (user.role === "admin") {
//         return res.json({ lecture });
//     }

//     if (!user.subscription.includes(lecture.course)) {
//         return res.status(400).json({
//             message: "You have not subscribed to this course",
//         });
//     }

//     return res.json({ lecture });
// });

export const fetchLecture = TryCatch(async (req, res) => {
    // console.log("fetchLecture")
    const lectures = await Lecture.find({
        Course: req.params.id, // ya course: req.params.id agar schema me lowercase hai
    });

    const user = await User.findById(req.user.id);

    if (user.role === "admin") {
        return res.json({ lectures });
    }

    const isSubscribed = user.subscription.some(
        (id) => id.toString() === req.params.id
    );

    if (!isSubscribed) {
        return res.status(400).json({
            message: "You have not subscribed to this course",
        });
    }

    return res.json({ lectures });
});

export const getMyCourses = TryCatch(async (req, res) => {
    const courses = await Courses.find({ _id: req.user.subscription });

    res.json({
        courses,
    });
});

export const checkout = TryCatch(async (req, res) => {
    const user = await User.findById(req.user._id);

    const course = await Courses.findById(req.params.id);

    if (user.subscription.includes(course._id)) {
        return res.status(400).json({
            message: "you already have this course",
        });
    }

    const options = {
        amount: Number(course.price * 100),
        currency: "INR",
        receipt: "some_receipt_id",
    };

    const order = await instance.orders.create(options);

    res.status(201).json({
        order,
        course,
        key_id: process.env.Razorpay_Key, // ✅ ab frontend ko backend se hi key milega
    });
});

export const paymentVerification = TryCatch(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    console.log("=== DEBUG START ===");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
    console.log("Received Signature:", razorpay_signature);
    console.log("Secret in use:", process.env.Razorpay_Secret);

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.Razorpay_Secret)
        .update(body)
        .digest("hex");

    console.log("Expected Signature:", expectedSignature);
    console.log("Match:", expectedSignature === razorpay_signature);
    console.log("=== DEBUG END ===");

    const isAutentic = expectedSignature === razorpay_signature;
    // ... baaki code same


    console.log("Expected:", expectedSignature);
    console.log("Received:", razorpay_signature);
    console.log("Match:", isAutentic);

    if (isAutentic) {
        await Payment.create({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        const user = await User.findById(req.user._id);
        const course = await Courses.findById(req.params.id);

        user.subscription.push(course._id);
        await user.save();

        res.status(200).json({
            message: "Course Purchased Successfully",
        });
    } else {
        res.status(400).json({
            message: "Payment Faild",
        });
    }
});