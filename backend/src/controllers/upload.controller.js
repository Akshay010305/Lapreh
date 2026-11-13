const fs = require("fs");
const path = require("path");

const uploadDir = path.resolve(__dirname, "../../uploads/products");

const uploadProductImage = (req, res) => {
  const { image, fileName = "product-image" } = req.body;
  if (!image || typeof image !== "string") {
    return res.status(400).json({ message: "Image file is required" });
  }

  const match = image.match(/^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ message: "Upload a PNG, JPG, JPEG, or WEBP image" });
  }

  const extension = match[1].split("/")[1].replace("jpeg", "jpg");
  const safeName = String(fileName)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 50) || "product-image";
  const finalName = `${Date.now()}-${safeName}.${extension}`;
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, finalName), Buffer.from(match[2], "base64"));

  res.status(201).json({
    message: "Image uploaded",
    imageUrl: `/uploads/products/${finalName}`,
  });
};

module.exports = { uploadProductImage };
