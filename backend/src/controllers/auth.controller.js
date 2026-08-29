const login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    // Static mock authentication check
    const token = process.env.AUTH_TOKEN || 'demo-static-token';

    return res.status(200).json({
      token,
      message: 'Login successful',
      user: {
        username: username.trim(),
        role: 'admin',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
