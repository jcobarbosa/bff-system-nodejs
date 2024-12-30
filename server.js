const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

require('dotenv').config();

const app = express();

app.use(express.json());

const MAIN_API_URL = process.env.MAIN_API_URL;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate and forward requests
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Function to forward requests to the main API
const forwardRequest = async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${MAIN_API_URL}${req.originalUrl}`,
      headers: {
        ...req.headers,
        Authorization: `Bearer ${req.user.token}`, // Forward the JWT token
      },
      data: req.body,
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(error.response ? error.response.status : 500).json(error.response ? error.response.data : { error: 'Internal Server Error' });
  }
};

// Function to forward requests to the main API
const forwardPublicRequest = async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${MAIN_API_URL}${req.originalUrl}`,
      headers: {
        ...req.headers
      },
      data: req.body,
      timeout: 5000, // Increase timeout to 5 seconds
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).json(error.response ? error.response.data : { error: 'Internal Server Error' });
  }
};

// Public routes
app.post('/login', forwardPublicRequest);
app.post('/refresh-token', forwardPublicRequest);

// Secured routes
app.use(authenticateJWT);
app.use(forwardRequest);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`BFF server is running on port ${PORT}`);
});