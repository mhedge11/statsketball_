//grab database info from env config
require('dotenv').config({path:'./process.env'})

//dependencies for express, body-parser and database
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');

//loads homepage
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/html/home.html');
});

app.post('/team', function(req, res) {
    connection.query(
        "select * from Player where Player.teamID = 1",
        function(error, results, fields) {
          if (error) throw error;
          res.json(results);
        }
      );
});

app.set('port', process.env.PORT || 3306);
app.listen(3306, () => console.log('App listening on port 3306'));