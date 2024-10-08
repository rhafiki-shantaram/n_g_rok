const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ngrok = require('ngrok'); // Add the Ngrok package

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());

const routes = require('./routes');
app.use('/api', routes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  try {
    // Start ngrok when the server starts
    const url = await ngrok.connect(PORT); // This creates an ngrok tunnel to your localhost:3000
    console.log(`Ngrok tunnel is live at ${url}`);
  } catch (error) {
    console.error('Error starting Ngrok:', error);
  }
});
