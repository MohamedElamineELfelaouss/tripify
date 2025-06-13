import express from "express";
import { promisify } from "util";
import dataClient from "../grpc/clients/dataServiceClient.js";

const router = express.Router();

const getWeather = promisify(dataClient.GetWeather.bind(dataClient));

router.get("/weather", async (req, res) => {
  try {
    const { city = "Paris", country = "FR" } = req.query;
    const result = await getWeather({ city, country_code: country });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Data service gRPC error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch weather" });
  }
});

export default router;
