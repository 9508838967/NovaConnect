const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
});

const getAccessTokenCookieOptions = () => ({
  ...getCookieOptions(),
  maxAge: 24 * 60 * 60 * 1000, // 1din
});

const getRefreshTokenCookieOptions = () => ({
  ...getCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

module.exports = {
  getCookieOptions,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
};