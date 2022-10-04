//데이터베이스를 사용할 수 있도록 설정

const Sequelize = require('sequelize');

const User = require('./user');
const Good = require('./good');
const Auction = require('./auction');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

var sequelize = new Sequelize(
  config.database, config.username, 
  config.password, config);

db.sequelize = sequelize;

db.User = User;
db.Good = Good;
db.Auction = Auction;

User.init(sequelize);
Good.init(sequelize);
Auction.init(sequelize);

User.associate(db);
Good.associate(db);
Auction.associate(db);

module.exports = db;