//grab database info from env config
require('dotenv').config({path:'./process.env'})

//dependencies for express, body-parser and database
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());



//loads homepage
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/html/home.html');
});

app.get('/addplayer', function(req, res) {
    res.sendFile(__dirname + '/html/addplayer.html');
});

app.get('/reports', function(req, res) {
    res.sendFile(__dirname + '/html/reports.html');
});






//4x reports
app.post('/leadingscorersoverall', function(req, res) {
    connection.query(
        "SELECT playerName, SUM(points) as totalPoints, SUM(points) / COUNT(*) as PPG from PlayerGameStats, Player WHERE PlayerGameStats.playerId = Player.playerId GROUP BY PlayerGameStats.playerId ORDER BY PPG DESC LIMIT 10",
        function(error, results, fields) {
            if (error) throw error;
            res.json(results)
        }
      );
});

app.post('/leadingscorersteam', function(req, res) {
    connection.query(
        "",
        function(error, results, fields) {
            if (error) throw error;
            res.json(results)
        }
      );
});

app.post('/topscoringteams', function(req, res) {
    connection.query(
        "SELECT teamName, SUM(points) as totalPoints, SUM(points) / COUNT(DISTINCT gameId) as PPG FROM PlayerGameStats, Team WHERE PlayerGameStats.teamId = Team.teamId GROUP BY PlayerGameStats.teamId ORDER BY PPG DESC LIMIT 10",
        function(error, results, fields) {
            if (error) throw error;
            res.json(results)
        }
      );
});

app.post('/fgpercent', function(req, res) {
    connection.query(
        "SELECT playerName, (SUM(2pmade) + SUM(3pmade)) / (SUM(2patt) + SUM(3patt)) AS \"FG\%\" FROM PlayerGameStats, Player WHERE PlayerGameStats.playerId = Player.playerId GROUP BY PlayerGameStats.playerId ORDER BY (SUM(2pmade) + SUM(3pmade)) / (SUM(2patt) + SUM(3patt)) DESC LIMIT 10",
        function(error, results, fields) {
            if (error) throw error;
            res.json(results)
        }
      );
});




//at /team displays all players on a team
app.post('/team', function(req, res) {
    connection.query(
        "select playerName from Player, PlayerTeam where Player.playerId = PlayerTeam.playerId and PlayerTeam.teamId = 1",
        function(error, results, fields) {
            if (error) throw error;
            res.json(results)
        }
      );
});


//add players (need to add to Player and PlayerTeam tables)
app.post("/inputplayers", function (req, res) {
    connection.query(
        "insert into Player(playerId, playerName) values ("
        + req.body.playerId + ", " + "'" + req.body.playerName + "'" + ")",
        function(error, results, fields) {
            if (error) {
                if(error.errno==1062) {
                    res.redirect('/'); 
                }
                else throw error;
            }
        }
      );
      connection.query(
        "insert into PlayerTeam(playerId, teamId) values ("
        + req.body.playerId + ", " + "'" + req.body.teamId + "'" + ")",
        function(error, results, fields) {
            if (error) {
                if(error.errno==1062) {
                    res.redirect('/'); 
                }
                else throw error;
            }
        }
      );
      res.redirect("/")
});


//port to listen on
app.set('port', process.env.PORT || 3306);
app.listen(3306, () => console.log('App listening on port 3306'));