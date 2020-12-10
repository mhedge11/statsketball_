//grab database info from env config
require('dotenv').config({ path: './process.env' })

//dependencies for express, body-parser and database
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connection = require('./database');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

//initialize sequelize connection
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}
//------------------------------------------------------------------------------------------------------------


//create Player model
const Player = sequelize.define('Player', {
    // Model attributes are defined here
    playerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    playerName: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'Player',
    timestamps: false
});

//create PlayerTeam model
const PlayerTeam = sequelize.define('PlayerTeam', {
    // Model attributes are defined here
    playerId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    teamId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE
    },
    endDate: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'PlayerTeam',
    timestamps: false
});

//create association between Player and PlayerTeam for JOIN
Player.belongsTo(PlayerTeam, {
    targetKey: 'playerId',
    foreignKey: 'playerId'
})



//create Coach model
const Coach = sequelize.define('Coach', {
    // Model attributes are defined here
    coachId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    coachName: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'Coach',
    timestamps: false
});

//create CoachTeam model
const CoachTeam = sequelize.define('CoachTeam', {
    // Model attributes are defined here
    coachId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    teamId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE
    },
    endDate: {
        type: DataTypes.DATE
    },
    gamesWon: {
        type: DataTypes.INTEGER
    },
    gamesLost: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'CoachTeam',
    timestamps: false
});

//create association between Coach and CoachTeam for JOIN
Coach.belongsTo(CoachTeam, {
    targetKey: 'coachId',
    foreignKey: 'coachId'
})
//-------------------------------------------------------------------------------




//load html pages

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/html/home.html');
});

app.get('/addplayer', function (req, res) {
    res.sendFile(__dirname + '/html/addplayer.html');
});

app.get('/addteam', function (req, res) {
    res.sendFile(__dirname + '/html/addteam.html');
});

app.get('/deleteteam', function (req, res) {
    res.sendFile(__dirname + '/html/deleteteam.html');
});

app.get('/reports', function (req, res) {
    res.sendFile(__dirname + '/html/reports.html');
});
app.get('/indexreports', function (req, res) {
    res.sendFile(__dirname + '/html/indexreports.html');
});

//-----------------------------------------------------------------------------------


//index reports
app.post('/anames', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT playerName from Player where playerName LIKE 'A%'",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write(element.playerName + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

app.post('/over35', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT playerName, points from PlayerGameStats, Player WHERE points > 35 AND Player.playerId = PlayerGameStats.playerId",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write("Name: " + element.playerName + "\n")
                res.write("Points: " + element.points + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

app.post('/tripdub', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT playerName, points, rebounds, assists from PlayerGameStats, Player WHERE points > 10 AND rebounds > 10 AND assists > 10 AND Player.playerId = PlayerGameStats.playerId",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write("Name: " + element.playerName + "\n")
                res.write("Points: " + element.points + "\n")
                res.write("Rebounds: " + element.rebounds + "\n")
                res.write("Assists: " + element.assists + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

app.post('/coachwinpercent', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT Coach.coachName, COALESCE(NULL, (gamesWon/(gamesWon + gamesLost) * 100), 'No games played') AS percentage FROM CoachTeam, Coach WHERE CoachTeam.coachId = Coach.coachId",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write("Name: " + element.coachName + "\n")
                res.write("Win %: " + element.percentage + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

//4x reports
app.post('/leadingscorersoverall', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT playerName, SUM(points) as totalPoints, SUM(points) / COUNT(*) as PPG from PlayerGameStats, Player WHERE PlayerGameStats.playerId = Player.playerId GROUP BY PlayerGameStats.playerId ORDER BY PPG DESC LIMIT 10",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write(element.playerName + "\n")
                res.write("Total points: " + element.totalPoints + "\n")
                res.write("Points per game: " + element.PPG + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

app.post('/leadingscorersteam', function (req, res) {
    connection.execute(
    // connection.query(
        "select teamName as Team, playerName as Player, maximumScore as TotalPoints from (SELECT pgs.teamId, pgs.playerId, playerName, Team.teamName, SUM(points) as Score FROM Test.PlayerGameStats as pgs, Test.Player, Test.Team where pgs.playerId = Player.playerID and pgs.teamId = Team.teamId GROUP BY teamId, playerId) teampoints, (SELECT teamId, MAX(Score) as maximumScore FROM (SELECT teamId, playerId, SUM(points) as Score FROM Test.PlayerGameStats as pgs GROUP BY teamId, playerId) s group by teamId) as teamTable where teampoints.teamId = teamTable.teamId and teampoints.Score = maximumScore",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write(element.Team + "\n")
                res.write("Total points: " + element.Player + "\n")
                res.write("Points per game: " + element.TotalPoints + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

app.post('/topscoringteams', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT teamName, SUM(points) as totalPoints, SUM(points) / COUNT(DISTINCT gameId) as PPG FROM PlayerGameStats, Team WHERE PlayerGameStats.teamId = Team.teamId GROUP BY PlayerGameStats.teamId ORDER BY PPG DESC LIMIT 10",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write(element.teamName + "\n")
                res.write("Total points: " + element.totalPoints + "\n")
                res.write("Points per game: " + element.PPG + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

app.post('/fgpercent', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT playerName, (SUM(2pmade) + SUM(3pmade)) / (SUM(2patt) + SUM(3patt)) AS fg FROM PlayerGameStats, Player WHERE PlayerGameStats.playerId = Player.playerId GROUP BY PlayerGameStats.playerId ORDER BY fg DESC LIMIT 10",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write(element.playerName + "\n")
                res.write("FG%: " + element.fg + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});



//ORM function
//at /team displays all players on a team
app.post('/team', function (req, res) {
    async function coachFunction() {
        return Coach.findAll({
            raw: true,
            include: [{
                model: CoachTeam,
                where: {
                    teamId: 1
                }
            }],
        })
    }
    coachFunction().then(
        function (value) {
            res.write("Coach: \n")
            value.forEach(element => {
                res.write(element.coachName + "\n", function (err) { })
            })
        },
    ).catch()
    async function playerFunction() {
        return Player.findAll({
            raw: true,
            include: [{
                model: PlayerTeam,
                where: {
                    teamId: 1
                }
            }],
        })
    }
    playerFunction().then(
        function (value) {
            res.write("\nPlayers: \n")
            value.forEach(element => {
                res.write(element.playerName + "\n", function (err) { res.end(); })
            })
        },
    ).catch()
});


//add players (need to add to Player and PlayerTeam tables)
app.post("/inputplayers", function (req, res) {
    async function inputFunction() {
        Player.create({ playerId: req.body.playerId, playerName: req.body.playerName });
    }
    inputFunction().then(
        function (value) {
            console.log("Done")
        },
    ).catch()

    async function inputFunction2() {
        PlayerTeam.create({ playerId: req.body.playerId, teamId: req.body.teamId });
    }
    inputFunction2().then(
        function (value) {
            console.log("Done")
        },
    ).catch()
    res.redirect("/")
});


app.post('/inputteam', function (req, res) {
    connection.beginTransaction(function(err) {
        if (err) { throw err; }
        // connection.query(
        //     "insert into Team(teamID, teamName) values (" + connection.escape(req.body.teamId) + ", " + "" + connection.escape(req.body.teamName) + ")",
        connection.execute(
            "insert into Team(teamID, teamName) values (" + connection.escape(req.body.teamId) + ", " + "" + connection.escape(req.body.teamName) + ")",

            function(err, result) {
          if (err) { 
            connection.rollback(function() {
              throw err;
            });
          }
          connection.commit(function(err) {
            if (err) { 
              connection.rollback(function() {
                throw err;
              });
            }
            console.log('success!');
          });
        });
      });
      res.redirect("/")
});

app.post('/viewteams', function (req, res) {
    connection.execute(
    // connection.query(
        "SELECT * FROM Team",
        function (error, results, fields) {
            if (error) throw error;
            results.forEach(element => {
                res.write("ID: " + element.teamId + "\n")
                res.write("Team Name: " + element.teamName + "\n")
                res.write("\n")
            });
            res.end()
        }
    );
});

app.post('/removeteam', function (req, res) {
    connection.execute(
    // connection.query(
        "DELETE FROM Team WHERE teamName = '" + req.body.teamName + "'",
        function (error, results, fields) {
            if (error) throw error;
        }
    );
    res.redirect("/")
});



//port to listen on
app.set('port', process.env.PORT || 3306);
app.listen(3306, () => console.log('App listening on port 3306'));