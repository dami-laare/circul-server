const sendToken = (user, statusCode, res, full) => {
  const token = user.getJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  let initData;

  if (!full) {
    initData = {
      username: user.username,
      firstSignIn: user.firstSignUp,
      bio: user.bio,
    };
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      ...initData,
      user: full ? user : null,
      profileComplete: true,
    });
};

module.exports = sendToken;
