import mongoose from "mongoose";

const FavoriteStaffSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add an index to ensure a customer cannot favorite the same staff multiple times
FavoriteStaffSchema.index({ customerId: 1, staffId: 1 }, { unique: true });

const FavoriteStaff = mongoose.model("FavoriteStaff", FavoriteStaffSchema);
export default FavoriteStaff;
