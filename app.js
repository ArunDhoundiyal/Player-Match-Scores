const express = require("express");
const server_instance = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let dataBase = null;
server_instance.use(express.json());

const initializeDataBaseAndServer = async () => {
  try {
    dataBase = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    server_instance.listen(5000, () => {
      console.log("server is running on http://localhost:5000/");
    });
  } catch (Error) {
    console.log(`Database Error ${Error.message}`);
    process.exit(1);
  }
};

initializeDataBaseAndServer();

const player_details_snakeCase_into_camelCase = (playerArray) => {
  return {
    playerId: playerArray.player_id,
    playerName: playerArray.player_name,
  };
};

const match_details_snakeCase_into_camelCase = (matchDetail) => {
  return {
    matchId: matchDetail.match_id,
    match: matchDetail.match,
    year: matchDetail.year,
  };
};

// API = 1 (GET details of All players)
server_instance.get("/players/", async (request, response) => {
  const getAllPlayerDetails = `SELECT * FROM  player_details;`;
  const allPlayerDetails = await dataBase.all(getAllPlayerDetails);
  console.log(allPlayerDetails);
  response.send(
    allPlayerDetails.map((playerArray) =>
      player_details_snakeCase_into_camelCase(playerArray)
    )
  );
});

// API 2 (GET detail of player)
server_instance.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetail = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const playerDetail = await dataBase.get(getPlayerDetail);
  console.log(playerDetail);
  response.send(player_details_snakeCase_into_camelCase(playerDetail));
});

// API 3 (PUT update detail of player)
server_instance.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const request_body = request.body;
  const { playerName } = request_body;
  const updatePlayerDetail = `UPDATE player_details SET player_name = '${playerName}'
  WHERE player_id = ${playerId};`;
  const nameOfPlayer = await dataBase.run(updatePlayerDetail);
  response.send("Player Details Updated");
});

// API 4 (GET detail of match)
server_instance.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetail = `SELECT * FROM match_details WHERE match_id	 = ${matchId};`;
  const matchDetail = await dataBase.get(getMatchDetail);
  response.send(match_details_snakeCase_into_camelCase(matchDetail));
});

// API 5 (GET all list of all the matches of a player )

server_instance.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const joinMatchDetailsWithPlayerMatchScore = `SELECT * 
  FROM match_details NATURAL JOIN player_match_score WHERE 
  player_id = ${playerId};`;
  const getMatchArray = await dataBase.all(
    joinMatchDetailsWithPlayerMatchScore
  );
  console.log(getMatchArray);
  response.send(
    getMatchArray.map((MatchArray) =>
      match_details_snakeCase_into_camelCase(MatchArray)
    )
  );
});

// API 6 (GET list of players of a specific match)

server_instance.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const joinPlayerDetailsAndPlayerMatchScore = `SELECT player_id AS playerId,
   player_name as playerName
    FROM player_details NATURAL JOIN player_match_score WHERE 
    match_id = ${matchId};`;
  const getPlayerDetails = await dataBase.all(
    joinPlayerDetailsAndPlayerMatchScore
  );
  console.log(getPlayerDetails);
  response.send(getPlayerDetails);
});

// API 7 (GET Returns the statistics of the total score, fours, sixes of a specific player based on the player ID)
server_instance.get(
  "/players/:playerId/playerScores",
  async (request, response) => {
    const { playerId } = request.params;
    const joinPlayerDetailsAndPlayerMatchScore = `SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM 
    player_details 
    INNER JOIN
     player_match_score
      ON 
      player_details.player_id = player_match_score.player_id
      WHERE 
      player_details.player_id = ${playerId};`;
    const statisticsOfPlayer = await dataBase.get(
      joinPlayerDetailsAndPlayerMatchScore
    );
    response.send(statisticsOfPlayer);
  }
);
module.exports = server_instance;
