const mysql = require('mysql');
const config = require('./config');
// 连接数据库
const database = mysql.createConnection({
	host:config.host,
	port:config.port,
	user:config.user,
	password:config.password,
	database:config.database
});
database.connect();
module.exports = database;