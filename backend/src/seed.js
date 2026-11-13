const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");

const Category = require("./models/category.model");
const Cart = require("./models/cart.model");
const Order = require("./models/order.model");
const Product = require("./models/product.model");
const User = require("./models/user.model");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const seed = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in backend/.env");

  const productDataPath = path.resolve(__dirname, "../../lapreh.products-org.json");
  const exportedProducts = JSON.parse(fs.readFileSync(productDataPath, "utf8"));
  const sourceCategoryIds = [
    ...new Set(exportedProducts.map((product) => product.category?.$oid).filter(Boolean)),
  ];

  if (sourceCategoryIds.length === 0) {
    throw new Error("No category references found in lapreh.products-org.json");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const sourceCategories = await Category.find({ _id: { $in: sourceCategoryIds } }).select(
    "_id name"
  );
  const categoriesById = new Map(
    sourceCategories.map((category) => [String(category._id), category])
  );
  const productsToSeed = exportedProducts.map((product) => {
    const categoryId = product.category?.$oid;
    const category = categoriesById.get(categoryId);
    if (!category) {
      throw new Error(
        `Category ${categoryId || "(missing)"} for product ${product.productCode} was not found`
      );
    }

    return {
      name: product.name,
      productId: product.productId,
      productCode: product.productCode,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      imageCount: product.imageCount,
      sortOrder: product.sortOrder,
      stock: product.stock,
      images: product.images || [],
      videos: product.videos || [],
      image: product.images?.[0] || "",
      video: product.videos?.[0] || "",
      category: category._id,
    };
  });

  await Product.collection.dropIndex("slug_1").catch(() => {});
  await Product.collection.dropIndex("productCode_1").catch(() => {});

  await Product.deleteMany();
  await Order.deleteMany();
  await Cart.deleteMany();
  await User.deleteMany();

  const createdProducts = await Product.insertMany(productsToSeed);

  const password = await bcrypt.hash("Practice123!", 10);
  const [admin, customer, secondCustomer] = await User.create([
    {
      name: "Lapreh Store Admin",
      email: "admin@laprehcreations.com",
      password,
      isAdmin: true,
      isEmailVerified: true,
    },
    {
      name: "Aarav Sharma",
      email: "aarav@example.com",
      password,
      isEmailVerified: true,
      wishlist: createdProducts.slice(0, 3).map((product) => product._id),
      addresses: [
        {
          label: "Home",
          name: "Aarav Sharma",
          phone: "9876543210",
          street: "24 Rosewood Apartments",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110034",
          isDefault: true,
        },
      ],
    },
    {
      name: "Meera Kapoor",
      email: "meera@example.com",
      password,
      isEmailVerified: true,
      wishlist: createdProducts.slice(3, 6).map((product) => product._id),
      addresses: [
        {
          label: "Work",
          name: "Meera Kapoor",
          phone: "9812345678",
          street: "18 Galleria Market",
          city: "Gurgaon",
          state: "Haryana",
          pincode: "122009",
          isDefault: true,
        },
      ],
    },
  ]);

  const [firstProduct, secondProduct, thirdProduct] = createdProducts;
  await Cart.create([
    {
      user: customer._id,
      items: [
        {
          product: firstProduct._id,
          variantId: firstProduct.variants?.[0]?._id?.toString(),
          variantName: firstProduct.variants?.[0]?.name,
          quantity: 1,
        },
        { product: secondProduct._id, quantity: 1 },
      ],
    },
    {
      user: secondCustomer._id,
      items: [{ product: thirdProduct._id, quantity: 2 }],
    },
  ]);

  const buildOrderItem = (product, quantity) => ({
    product: product._id,
    name: product.name,
    image: product.image,
    originalImage: product.images?.[0] || product.image,
    price: product.price,
    quantity,
  });

  const deliveredItems = [buildOrderItem(firstProduct, 1)];
  const deliveredSubtotal = deliveredItems[0].price;
  const processingItems = [buildOrderItem(secondProduct, 1), buildOrderItem(thirdProduct, 1)];
  const processingSubtotal = processingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const pendingItems = [buildOrderItem(createdProducts[3], 1)];
  const pendingSubtotal = pendingItems[0].price;

  await Order.create([
    {
      user: customer._id,
      items: deliveredItems,
      address: customer.addresses[0].toObject(),
      subtotal: deliveredSubtotal,
      shipping: deliveredSubtotal >= 2000 ? 0 : 149,
      total: deliveredSubtotal + (deliveredSubtotal >= 2000 ? 0 : 149),
      paymentMethod: "online",
      paymentStatus: "paid",
      paymentReference: "pay_practice_001",
      isPaid: true,
      paidAt: new Date("2026-08-10T10:00:00Z"),
      status: "delivered",
      invoiceNumber: "LAP-2026-DEMO01",
      invoiceIssuedAt: new Date("2026-08-10T10:00:00Z"),
      tracking: {
        courier: "Delhivery",
        trackingNumber: "DEMO123456789",
        estimatedDelivery: new Date("2026-08-15T10:00:00Z"),
        deliveredAt: new Date("2026-08-14T10:00:00Z"),
      },
      statusHistory: [
        { status: "confirmed", actor: "system", note: "Payment received" },
        { status: "processing", actor: "admin", note: "Packed for dispatch" },
        { status: "shipped", actor: "admin", note: "Handed to Delhivery" },
        { status: "delivered", actor: "system", note: "Delivered to customer" },
      ],
    },
    {
      user: secondCustomer._id,
      items: processingItems,
      address: secondCustomer.addresses[0].toObject(),
      subtotal: processingSubtotal,
      shipping: processingSubtotal >= 2000 ? 0 : 149,
      total: processingSubtotal + (processingSubtotal >= 2000 ? 0 : 149),
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "processing",
      invoiceNumber: "LAP-2026-DEMO02",
      invoiceIssuedAt: new Date("2026-08-18T10:00:00Z"),
      statusHistory: [
        { status: "confirmed", actor: "system", note: "Order confirmed for cash on delivery" },
        { status: "processing", actor: "admin", note: "Order is being prepared" },
      ],
    },
    {
      user: customer._id,
      items: pendingItems,
      address: customer.addresses[0].toObject(),
      subtotal: pendingSubtotal,
      shipping: pendingSubtotal >= 2000 ? 0 : 149,
      total: pendingSubtotal + (pendingSubtotal >= 2000 ? 0 : 149),
      paymentMethod: "online",
      paymentStatus: "pending",
      status: "pending",
      invoiceNumber: "LAP-2026-DEMO03",
      invoiceIssuedAt: new Date("2026-08-22T10:00:00Z"),
      statusHistory: [{ status: "pending", actor: "system", note: "Awaiting online payment" }],
    },
  ]);

  console.log(
    `Seed complete: used ${sourceCategories.length} existing categories, added ${productsToSeed.length} products, 3 users, 2 carts, and 3 practice orders.`
  );
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  process.exit(1);
});
