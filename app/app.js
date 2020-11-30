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
        type: DataTypes.INTEGER
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
//-------------------------------------------------------------------------------




//load html pages

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/html/home.html');
});

app.get('/addplayer', function (req, res) {
    res.sendFile(__dirname + '/html/addplayer.html');
});

app.get('/reports', function (req, res) {
    res.sendFile(__dirname + '/html/reports.html');
});

//-----------------------------------------------------------------------------------




//4x reports
app.post('/leadingscorersoverall', function (req, res) {
    connection.query(
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
    connection.query(
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
    connection.query(
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
    connection.query(
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
    // connection.query(
    //     "select playerName from Player, PlayerTeam where Player.playerId = PlayerTeam.playerId and PlayerTeam.teamId = 1",
    //     function(error, results, fields) {
    //         if (error) throw error;
    //         results.forEach(element => {
    //             res.write(element.playerName + "\n")
    //         });
    //         res.end()
    //     }
    //   );
    async function myFunction() {
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
    myFunction().then(
        function (value) {
            value.forEach(element => {
                res.write(element.playerName + "\n", function (err) { res.end(); })
            })
        },
    );
});


//add players (need to add to Player and PlayerTeam tables)
app.post("/inputplayers", function (req, res) {
    connection.query(
        "insert into Player(playerId, playerName) values ("
        + req.body.playerId + ", " + "'" + req.body.playerName + "'" + ")",
        function (error, results, fields) {
            if (error) {
                if (error.errno == 1062) {
                    res.redirect('/');
                }
                else throw error;
            }
        }
    );
    connection.query(
        "insert into PlayerTeam(playerId, teamId) values ("
        + req.body.playerId + ", " + "'" + req.body.teamId + "'" + ")",
        function (error, results, fields) {
            if (error) {
                if (error.errno == 1062) {
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