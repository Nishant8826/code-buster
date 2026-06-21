const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middlewares/asyncHandler');
const { validateCreateUser } = require('../utils/validation');

const createUser = asyncHandler(async (req, res, next) => {
  const { error, value } = validateCreateUser(req.body);
  if (error) {
    throw new ApiError(400, 'Validation failed', error);
  }

  const { email, password } = value;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    password: hashedPassword
  });

  const userResponse = user.toJSON();
  delete userResponse.password;

  return res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: userResponse
  });
});

module.exports = {
  createUser
};
