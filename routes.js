const express = require('express');
const router = express.Router();

// Route that prints incoming HTTP payload
router.post('/message', (req, res) => {
  const message = req.body.message;  // Make sure to access req.body.message
  if (message) {
    console.log('Received message:', message);
    res.send('Message received');
  } else {
    console.log('No message found in request');
    res.status(400).send('No message provided');
  }
});

module.exports = router;
