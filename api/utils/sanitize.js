'use strict';

function sanitizeUser(user) {
  const data = user.toJSON ? user.toJSON() : { ...user };
  delete data.password;
  delete data.refreshToken;
  return data;
}

module.exports = { sanitizeUser };
