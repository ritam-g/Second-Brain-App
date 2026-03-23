import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
});

//indes have to persist
userSchema.index({email: 1, username: 1}, {unique: true})

const userModel = mongoose.model("User", userSchema);

export default userModel;