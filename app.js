const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initialiseDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(process.env.PORT || 3000, console.log("Server Running"));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initialiseDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1 GET states
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
        *
    FROM
        state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

//API 2 GET a State
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
        *
    FROM
        state
    WHERE
        state_id=${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//API 3 GET Districts
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API 4 GET District
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
    SELECT
        *
    FROM
        district
    WHERE
        district_id = ${districtId};`;
  const district = await db.get(getDistrict);
  response.send(convertDbObjectToResponseObject1(district));
});

//API 5 DELETE District
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

//API 6 update District
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

//API 7 State Stats
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStats = `
    SELECT
        SUM(cases) AS cases,
        SUM(cured) AS cured,
        SUM(active) AS active,
        SUM(deaths) AS deaths
    FROM
        district
    WHERE
        state_id = ${stateId};`;
  const stateStats = await db.get(getStateStats);
  response.send({
    totalCases: stateStats.cases,
    totalCured: stateStats.cured,
    totalActive: stateStats.active,
    totalDeaths: stateStats.deaths,
  });
});

//API 8 District Details
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT
        state.state_name
    FROM
        district INNER JOIN state
        on district.state_id = state.state_id
    WHERE
        district.district_id = ${districtId};`;
  const districtDetails = await db.get(districtQuery);
  response.send({
    stateName: districtDetails.state_name,
  });
});
module.exports = app;
