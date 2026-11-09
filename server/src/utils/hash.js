const crypto = require('crypto');
const bcrypt = require('bcrypt');

const getBcryptRounds = () => parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

const hashPassword = (password) => bcrypt.hash(password, getBcryptRounds());

const comparePassword = (password, hash) => bcrypt.compare(password, hash);

const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

const randomToken = () => crypto.randomBytes(32).toString('hex');

module.exports = { hashPassword, comparePassword, sha256, randomToken };

