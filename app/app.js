//grab database info from env config
require('dotenv').config({path:'./process.env'})

//dependencies for express, body-parser and database
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');

//test / for Hello World
app.get('/', (req, res) => res.send('Hello World!'));

//going to port/3306 should show query
app.route('/player/')
  .get(function(req, res, next) {
    connection.query(
      "select * from Player",
      function(error, results, fields) {
        if (error) throw error;
        res.json(results);
      }
    );
  });

app.set('port', process.env.PORT || 3306);
app.listen(3306, () => console.log('App listening on port 3306'));