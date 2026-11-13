const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const {
  generateVerificationCode,
  normalizeEmail,
  sendVerificationEmail,
} = require("../utils/emailAuth");

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  isEmailVerified: Boolean(user.isEmailVerified),
});

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!name?.trim() || !normalizedEmail || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const user = new User({
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, 10),
    verificationCode,
    verificationCodeExpiresAt,
  });

  try {
    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name,
      code: verificationCode,
      minutes: 10,
    });
  } catch (error) {
    console.error("Verification email failed", error);
    return res.status(500).json({
      message: "Unable to send verification email. Please try again later.",
    });
  }

  await user.save();

  res.status(201).json({
    message: "Account created. Please verify your email with the code sent to your inbox.",
    user: publicUser(user),
    requiresVerification: true,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select("+password +verificationCode +verificationCodeExpiresAt");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      message: "Please verify your email before signing in.",
      email: user.email,
      requiresVerification: true,
    });
  }

  res.json({ token: createToken(user._id), user: publicUser(user) });
};

const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !code) {
    return res.status(400).json({ message: "Email and verification code are required" });
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+verificationCode +verificationCodeExpiresAt");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isEmailVerified) {
    return res.json({ message: "Email already verified", user: publicUser(user) });
  }

  if (!user.verificationCode || !user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
    return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
  }

  if (String(user.verificationCode) !== String(code)) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  user.isEmailVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  await user.save();

  res.json({
    message: "Email verified successfully",
    token: createToken(user._id),
    user: publicUser(user),
  });
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  const verificationCode = generateVerificationCode();
  const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  user.verificationCode = verificationCode;
  user.verificationCodeExpiresAt = verificationCodeExpiresAt;

  try {
    await sendVerificationEmail({
      to: normalizedEmail,
      name: user.name,
      code: verificationCode,
      minutes: 10,
    });
    await user.save();
  } catch (error) {
    console.error("Verification email failed", error);
    return res.status(500).json({
      message: "Unable to resend verification email. Please try again later.",
    });
  }

  res.json({ message: "A new verification code has been sent to your email." });
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
};

const getMe = (req, res) => {
  res.json(req.user);
};

module.exports = { getMe, login, logout, register, resendVerificationCode, verifyEmail };
