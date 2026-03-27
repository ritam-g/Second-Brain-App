import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    avatar: { type: String, default: "", trim: true },
}, {
    timestamps: true,
});

//indes have to persist
userSchema.index({ email: 1 }, { unique: true })
userSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password")) return next();
    user.password = await bcrypt.hash(user.password, 8);
    next();
})
userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};
const userModel = mongoose.model("User", userSchema);

export default userModel;
