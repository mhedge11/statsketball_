const mysql = require('mysql2');

//grab DB info from process.env
let connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASS,
  });
  
//attempt connection with GCP MySQL database
connection.connect(function(err) {
    if (err) {
    console.error('Error connecting: ' + err.stack);
    return;
    }
    console.log('Connected as thread id: ' + connection.threadId);
});
  
module.exports = connection;