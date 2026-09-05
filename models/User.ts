import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String }, // absent for Google-only users
    googleId: { type: String },
    image: { type: String },
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);
