const express = require("express");
const { createClient } = require("redis");
const axios = require("axios");

const app = express();
const port = 3000;
const startWarsUrl = "https://swapi.dev/api";

// connect to redis db on localhost
const redisClient = createClient();

// listen for errors
redisClient.on("err", (err) => {
  console.log("redis client error", err);
});

// listen for successful connection
redisClient.connect().then(() => {
  console.log("redis connected successfully");
});

const fetchStarWarsData = async (dataToFetch) => {
  // data to fetch can be people, planet, films, species, vehicles and startships
  const response = await axios.get(`${startWarsUrl}/${dataToFetch}`);

  return response.data;
};

app.get("star-wars/:dataToFetch", async (req, res) => {
  try {
    const dataToFetch = req.params.dataToFetch;

    // check if data is cached and return cached data
    const cacheResult = await redisClient.get(dataToFetch);
    if (cacheResult) {
      const parsedResult = JSON.parse(cacheResult);

      return res.status(200).json({ isCached: true, data: parsedResult });
    }

    // fetch data from api and cache if data is not already cached
    result = await fetchStarWarsData(dataToFetch);
    await redisClient.set(dataToFetch, JSON.stringify(result), {
      EX: 300,
      NX: true,
    });

    return res.status(200).json({ isCached: false, data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});
