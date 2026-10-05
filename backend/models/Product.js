const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 1 },
    mrp: { type: Number, min: 1, default: function () { return this.price; } },
    unit: { type: String, trim: true, default: "1 pack" },
    image: { type: String, default: "https://via.placeholder.com/150" },
    category: {
      type: String, required: true,
      enum: ["Fruits","Dairy","Snacks","Grocery","Cafe","Home","Toys","Fresh","Electronics","Mobiles","Beauty","Fashion"],
    },
    stock: { type: Number, default: 10, min: 0 },
    description: { type: String, default: "" },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    storeName: { type: String, default: "Admin Store" },
    isAvailable: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 4.5 },
  },
  { timestamps: true }
);

productSchema.virtual("discountPercent").get(function () {
  if (!this.mrp || this.mrp <= this.price) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
