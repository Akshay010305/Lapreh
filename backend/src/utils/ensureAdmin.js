const bcrypt = require("bcrypt");
const User = require("../models/user.model");

const ensureAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@admin.com";
  const password = process.env.ADMIN_PASSWORD || "admin";
  const existingAdmin = await User.findOne({ email }).select("+password");

  if (existingAdmin) {
    const passwordMatches = await bcrypt.compare(password, existingAdmin.password);

    if (!existingAdmin.isAdmin || !existingAdmin.isEmailVerified || !passwordMatches) {
      existingAdmin.isAdmin = true;
      existingAdmin.isEmailVerified = true;
      existingAdmin.password = await bcrypt.hash(password, 10);
      await existingAdmin.save();
    }

    return;
  }

  await User.create({
    name: "Administrator",
    email,
    password: await bcrypt.hash(password, 10),
    isAdmin: true,
    isEmailVerified: true,
  });
};

module.exports = ensureAdmin;
