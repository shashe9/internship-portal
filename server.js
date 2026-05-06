const express = require('express');
const session = require('express-session');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// simple session configuration for authentication
app.use(session({
    secret: 'simple-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // secure: false since we're testing on localhost (no https)
}));

// middleware to parse json and url-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve frontend files from the public directory
app.use(express.static('public'));

// use api routes
app.use('/api', apiRoutes);

// start the server
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
