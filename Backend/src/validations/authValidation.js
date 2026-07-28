const validateRegister = (data) => {
  const errors = [];

  if (!data.username || data.username.length < 3 || data.username.length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  }

  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  return errors;
};

const validateLogin = (data) => {
  const errors = [];

  if (!data.email && !data.username) {
    errors.push('Please provide email or username');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return errors;
};

module.exports = { validateRegister, validateLogin };