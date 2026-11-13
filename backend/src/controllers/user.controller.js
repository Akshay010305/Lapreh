const addressFields = ["name", "phone", "street", "city", "state", "pincode"];

const normalizeAddress = (body) => ({
  label: String(body.label || "Home").trim().slice(0, 30),
  name: String(body.name || "").trim(),
  phone: String(body.phone || "").replace(/\D/g, "").slice(-10),
  street: String(body.street || "").trim(),
  city: String(body.city || "").trim(),
  state: String(body.state || "").trim(),
  pincode: String(body.pincode || "").replace(/\D/g, "").slice(0, 6),
  isDefault: Boolean(body.isDefault),
});

const validateAddress = (address) => {
  const missingField = addressFields.find((field) => !address[field]);
  if (missingField) return `${missingField} is required`;
  if (!/^[6-9]\d{9}$/.test(address.phone)) return "Enter a valid 10-digit Indian phone number";
  if (!/^\d{6}$/.test(address.pincode)) return "Enter a valid 6-digit PIN code";
  return null;
};

const setOnlyDefault = (user, addressId) => {
  user.addresses.forEach((address) => {
    address.isDefault = address._id.toString() === addressId.toString();
  });
};

const getProfile = (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  req.user.name = req.body.name || req.user.name;
  await req.user.save();
  res.json(req.user);
};

const addAddress = async (req, res) => {
  const address = normalizeAddress(req.body);
  const validationError = validateAddress(address);
  if (validationError) return res.status(400).json({ message: validationError });

  if (!req.user.addresses.some((savedAddress) => savedAddress.isDefault)) {
    address.isDefault = true;
  }
  req.user.addresses.push(address);
  const createdAddress = req.user.addresses[req.user.addresses.length - 1];
  if (address.isDefault) setOnlyDefault(req.user, createdAddress._id);

  await req.user.save();
  res.status(201).json(req.user.addresses);
};

const updateAddress = async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ message: "Address not found" });

  const wasDefault = address.isDefault;
  const updatedAddress = normalizeAddress({ ...address.toObject(), ...req.body });
  const validationError = validateAddress(updatedAddress);
  if (validationError) return res.status(400).json({ message: validationError });

  if (wasDefault && !updatedAddress.isDefault) updatedAddress.isDefault = true;
  address.set(updatedAddress);
  if (updatedAddress.isDefault) setOnlyDefault(req.user, address._id);
  await req.user.save();
  res.json(req.user.addresses);
};

const setDefaultAddress = async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ message: "Address not found" });

  setOnlyDefault(req.user, address._id);
  await req.user.save();
  res.json(req.user.addresses);
};

const deleteAddress = async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) return res.status(404).json({ message: "Address not found" });

  const wasDefault = address.isDefault;
  address.deleteOne();
  if (
    req.user.addresses.length > 0 &&
    (wasDefault || !req.user.addresses.some((savedAddress) => savedAddress.isDefault))
  ) {
    req.user.addresses[0].isDefault = true;
  }
  await req.user.save();
  res.json(req.user.addresses);
};

module.exports = {
  addAddress,
  deleteAddress,
  getProfile,
  setDefaultAddress,
  updateAddress,
  updateProfile,
};
