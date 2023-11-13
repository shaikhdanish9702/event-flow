require('dotenv').config()
const express = require('express');
const app = express();
const port = 3000;
const { pubCloseConn, pubInit, pubSendMessage, EventKeyConstants } = require('./pubSub')

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...', err)
    pubCloseConn()
    process.exit(1)
  })

// Define a route for handling GET requests
app.get('/', (req, res) => {
    pubSendMessage(302856, EventKeyConstants.MANDATE_PRESENTATION, { status: "SUCCESS", mandateAmount: 1234, bankAccountNumber: "1234", bankName: "SBI" })
    res.send('Hello, this is a GET request!');
});

// Start the server
app.listen(port, async() => {
  await pubInit()
    console.log(`Server is listening at http://localhost:${port}`);
});
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...', err)
    pubCloseConn()
    server.close(() => {
      process.exit(1)
    })
  })