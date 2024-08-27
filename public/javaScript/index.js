const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');

// Ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Render login page
router.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Handle login
router.post('/login', passport.authenticate('local', {
    successRedirect: '/events_editor',
    failureRedirect: '/login'
}));

// Render register page
router.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

// Handle registration
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).send('Error');
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) return res.status(500).send('Error');
            res.redirect('/login');
        });
    });
});

// Handle logout
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

// Protected routes
router.get('/events_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/events_editor.html');
});

router.get('/entrants_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/entrants_editor.html');
});

router.get('/declarations_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/declarations_editor.html');
});

router.get('/results_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/results_editor.html');
});

router.get('/profile', ensureAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/profile.html');
});

module.exports = router;
