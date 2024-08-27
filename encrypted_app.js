require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Load the secret key and IV from environment variables
const secretKey = Buffer.from(process.env.SECRET_KEY, 'hex');
const iv = Buffer.from(process.env.IV, 'hex');

// Encryption and Decryption functions
function encrypt(text) {
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(encryptedText) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Collects and orders results
function parseResult(result) {
    if (!result) return { value: Number.MAX_VALUE, type: 'time' }; // Handle null or empty results as the largest value for times

    if (result.includes(':')) {
        // It's a time result
        const parts = result.split(/[:.]/);
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        const milliseconds = parseInt(parts[2], 10);
        return { value: (minutes * 60) + seconds + (milliseconds / 100), type: 'time' };
    } else if (result.includes('m')) {
        // It's a distance result
        return { value: parseFloat(result.replace('m', '')), type: 'distance' };
    } else {
        // Fallback for other formats
        return { value: parseFloat(result), type: 'distance' };
    }
}

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'competition'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

// Session and Passport configuration
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// User model (simplified)
const User = {
    findOne: (username, cb) => {
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
            if (err) return cb(err);
            if (results.length === 0) return cb(null, null);

            return cb(null, results[0]);
        });
    },
    findById: (id, cb) => {
        db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
            if (err) return cb(err);
            if (results.length === 0) return cb(null, null);

            return cb(null, results[0]);
        });
    }
};

passport.use(new LocalStrategy(
    (username, password, done) => {
        User.findOne(username, (err, user) => {
            if (err) return done(err);
            if (!user) return done(null, false, { message: 'Incorrect username.' });
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password.' });
                }
            });
        });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// Ensure user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Routes for authentication
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));

app.get('/register', (req, res) => {
    console.log('Serving register page');
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Register route - handle form submission
app.post('/register', (req, res) => {
    const { username, password} = req.body;
    console.log('Received registration form:', username);

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error');
        }

        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                console.error('Error inserting user into database:', err);
                return res.status(500).send('Error');
            }

            console.log('User registered successfully:', username);
            res.redirect('/login');
        });
    });
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

// Protected routes
app.get('/events_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'events_editor.html'));
});

app.get('/entrants_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'entrants_editor.html'));
});

app.get('/declarations_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'declarations_editor.html'));
});

app.get('/results_editor', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results_editor.html'));
});

app.get('/profile', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;

    User.findById(userId, (err, user) => {
        if (err || !user) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Error fetching user');
        }

        res.render('profile', { user });
    });
});

// Existing API routes with encryption/decryption for sensitive data

app.get('/race/:race_id', ensureAuthenticated, (req, res) => {
    const raceId = parseInt(req.params.race_id);
    
    if (isNaN(raceId)) {
        return res.status(400).json({ error: 'Invalid race ID' });
    }

    const sql = 'SELECT * FROM events WHERE race_id = ?';
    const values = [raceId];
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Race not found' });
        }

        res.json(results[0]);
    });
});

// Collects an entrant's details based on their number
app.get('/entrant/:entrant_number', ensureAuthenticated, (req, res) => {
    const entrant_number = parseInt(req.params.entrant_number);
    
    if (isNaN(entrant_number)) {
        return res.status(400).json({ error: 'Invalid entrant number' });
    }

    const sql = 'SELECT * FROM entrants WHERE entrant_number = ?';
    const values = [entrant_number];
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Entrant not found' });
        }

        // Decrypt sensitive fields before sending them to the client
        results[0].email = decrypt(results[0].email);
        results[0].address = decrypt(results[0].address);
        results[0].dob = decrypt(results[0].dob);
        results[0].phone_number = decrypt(results[0].phone_number);

        res.json(results[0]);
    });
});

// Collects entrants from a race
app.get('/events/entrants/:race_id', ensureAuthenticated, (req, res) => {
    const raceId = parseInt(req.params.race_id);
    
    if (isNaN(raceId)) {
        return res.status(400).json({ error: 'Invalid race ID' });
    }

    const sql = 'SELECT * FROM entrants_events WHERE race_id = ?';
    const values = [raceId];
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Entrants not found' });
        }

        res.json(results);
    });
});

// Fetches declared entrants based on a raceId
app.get('/entrants/declared/:race_id', ensureAuthenticated, (req, res) => {
    const raceId = parseInt(req.params.race_id);
    
    if (isNaN(raceId)) {
        return res.status(400).json({ error: 'Invalid race ID' });
    }

    const sql = 'SELECT * FROM entrants_events WHERE race_id = ? AND signed_in = TRUE';
    const values = [raceId];
    
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Entrants not found' });
        }

        res.json(results);
    });
});

// Fetch all events
app.get('/events', ensureAuthenticated, (req, res) => {
    db.query('SELECT * FROM events', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Fetch all heats from a race
app.get('/events/heats/:race_id', ensureAuthenticated, (req, res) => {
    const race_id = req.params.race_id;
    const sql = `
        SELECT * FROM heats WHERE race_id = ?;
    `;
    db.query(sql, [race_id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Fetch all entrants
app.get('/entrants', ensureAuthenticated, (req, res) => {
    db.query('SELECT * FROM entrants', (err, results) => {
        if (err) throw err;

        // Decrypt sensitive fields
        results.forEach(entrant => {
            entrant.email = decrypt(entrant.email);
            entrant.address = decrypt(entrant.address);
            entrant.dob = decrypt(entrant.dob);
            entrant.phone_number = decrypt(entrant.phone_number);
        });

        res.json(results);
    });
});

// Fetch entrants by race ID
app.get('/entrants/:raceId', ensureAuthenticated, (req, res) => {
    const raceId = req.params.raceId;
    const sql = `
        SELECT e.*, ee.signed_in
        FROM entrants e
        JOIN entrants_events ee ON e.entrant_number = ee.entrant_number
        WHERE ee.race_id = ?
    `;
    db.query(sql, [raceId], (err, results) => {
        if (err) throw err;

        // Decrypt sensitive fields
        results.forEach(entrant => {
            entrant.email = decrypt(entrant.email);
            entrant.address = decrypt(entrant.address);
            entrant.dob = decrypt(entrant.dob);
            entrant.phone_number = decrypt(entrant.phone_number);
        });

        res.json(results);
    });
});

// Route to fetch entrants who have signed in
app.get('/entrants/signed_in', ensureAuthenticated, (req, res) => {
    const sql = `
        SELECT e.*, ee.race_id
        FROM entrants e
        JOIN entrants_events ee ON e.entrant_number = ee.entrant_number
        WHERE ee.signed_in = 1
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Failed to fetch signed-in entrants:', err);
            return res.status(500).send('Error fetching signed-in entrants');
        }

        // Decrypt sensitive fields
        results.forEach(entrant => {
            entrant.email = decrypt(entrant.email);
            entrant.address = decrypt(entrant.address);
            entrant.dob = decrypt(entrant.dob);
            entrant.phone_number = decrypt(entrant.phone_number);
        });

        res.json(results);
    });
});

// Get entrant's personal best for a race
app.get('/pb/:raceId/:entrantNumber', ensureAuthenticated, (req, res) => {
    const raceId = req.params.raceId;
    const entrantNumber = req.params.entrantNumber;
    const sql = `
        SELECT pb FROM entrants_events WHERE race_id = ? AND entrant_number = ?;
    `;
    const values = [raceId, entrantNumber];
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Failed to fetch pb:', err);
            return res.status(500).send('Error fetching pb');
        }
        res.json(results);
    });
});

// Get the result for an athlete
app.get('/entrants/:raceId/:entrantNumber/result', ensureAuthenticated, (req, res) => {
    const raceId = req.params.raceId;
    const entrantNumber = req.params.entrantNumber;
    const sql = `
        SELECT result FROM entrants_events WHERE race_id = ? AND entrant_number = ?;
    `;
    const values = [raceId, entrantNumber];
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Failed to fetch result:', err);
            return res.status(500).send('Error fetching result');
        }
        res.json(results);
    });
});

// Fetches the heat entry an athlete is competing in
app.get('/heats/:entrantNumber', ensureAuthenticated, (req, res) => {
    const entrantNumber = req.params.entrantNumber;
    const sql = `
        SELECT * FROM heat_assignments WHERE entrant_number = ?;
    `;
    const values = [entrantNumber];
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Failed to fetch heats:', err);
            return res.status(500).send('Error fetching heats');
        }
        res.json(results);
    });
});

// Update accepted status of entrants
app.post('/entrants/accept_entrants', ensureAuthenticated, async (req, res) => {
    const entrants = req.body.entrants;
    if (!entrants || entrants.length === 0) {
        return res.status(400).json({ message: 'No entrant data provided' });
    }

    try {
        // Collect all the promises from the database queries
        const updatePromises = entrants.map((entrant) => {
            // Update the accepted array in the database
            const sql = `
            UPDATE entrants
            SET accepted = ?
            WHERE entrant_number = ?;
            `;
            return new Promise((resolve, reject) => {
                db.query(sql, [JSON.stringify(entrant.accepted), entrant.entrant_number], (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });
        });

        // Resolve all updatePromises
        await Promise.all(updatePromises);

        res.json({ message: 'Entrants updated successfully' });
    } catch (err) {
        console.error('Failed to update entrants:', err);
        res.status(500).json({ message: 'Failed to update entrants' });
    }
});

// Update signed_in status of entrants
app.post('/entrants/update_signed_in', ensureAuthenticated, async (req, res) => {
    const entrants = req.body.entrants;

    if (!entrants || entrants.length === 0) {
        return res.status(400).json({ message: 'No entrant data provided' });
    }
    try {
        // Start a transaction
        await db.promise().query('START TRANSACTION');

        // Update the signed_in statuses
        for (const entrant of entrants) {
            const { entrant_number, race_id, signed_in } = entrant;

            // Update the signed_in status for the given race_id
            await db.promise().query(
                'UPDATE entrants_events SET signed_in = ? WHERE entrant_number = ? AND race_id = ?',
                [signed_in, entrant_number, race_id]
            );
        }

        // Commit the transaction
        await db.promise().query('COMMIT');

        res.json({ message: 'Entrants signed-in statuses updated successfully' });
    } catch (err) {
        console.error('Failed to update signed-in statuses:', err);
        
        // Rollback the transaction in case of error
        await db.promise().query('ROLLBACK');
        
        res.status(500).json({ message: 'Failed to update signed-in statuses' });
    }
});

// Adds a race to the race list of an entrant
app.post('/add/entrants/races', ensureAuthenticated, (req, res) => {
    const { raceId , entrantNumber} = req.body;

    if (!entrantNumber || !raceId) {
        return res.status(400).json({ message: 'Entrant number and race ID are required' });
    }

    const sql = 'INSERT INTO entrants_events (entrant_number, race_id, signed_in, pb) VALUES (?, ?, false, ?)';
    const values = [entrantNumber, raceId, ''];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error adding race to entrant' });
        }

        res.status(200).json({ message: 'Race added to entrant successfully' });
    });
});

// Fetches the currently accepted entrants for a race
app.post('/entrants/current_accepted', ensureAuthenticated, async (req, res) => {
    const entrantNumbers = req.body.entrants;
    if (!entrantNumbers || entrantNumbers.length === 0) {
        return res.status(400).json({ message: 'No entrant data provided' });
    }

    try {
        // SQL query to fetch accepted arrays for given entrant numbers
        const fetchSql = 'SELECT entrant_number, accepted FROM entrants WHERE entrant_number IN (?)';
        const [rows] = await db.promise().query(fetchSql, [entrantNumbers]);

        // Log raw database rows
        console.log("Raw database rows:", rows);

        // Object to store the current accepted data
        const currentAcceptedData = {};

        rows.forEach(row => {
            // Log the raw accepted field value
            console.log(`Raw accepted value for entrant_number ${row.entrant_number}:`, row.accepted);

            // Directly handle the accepted array
            let acceptedArray = row.accepted.filter(item => item !== null);

            // Log the filtered accepted array
            console.log(`Filtered accepted array for entrant_number ${row.entrant_number}:`, acceptedArray);

            currentAcceptedData[row.entrant_number] = acceptedArray;
        });

        res.json(currentAcceptedData);
    } catch (err) {
        console.error('Failed to fetch current accepted data:', err);
        res.status(500).json({ message: 'Failed to fetch current accepted data' });
    }
});

// Fetches the current signed in status of entrants
app.post('/entrants/current_signed_in', ensureAuthenticated, async (req, res) => {
    const entrantNumbers = req.body.entrants;
    if (!entrantNumbers || entrantNumbers.length === 0) {
        return res.status(400).json({ message: 'No entrant data provided' });
    }

    try {
        // SQL query to fetch signed_in statuses for given entrant numbers
        const fetchSql = `
            SELECT ee.entrant_number, ee.race_id, ee.signed_in
            FROM entrants_events ee
            WHERE ee.entrant_number IN (?)
        `;
        const [rows] = await db.promise().query(fetchSql, [entrantNumbers]);

        // Object to store the current signed_in data
        const currentSignedInData = {};

        rows.forEach(row => {

            // Ensure the entrant has an entry in the object
            if (!currentSignedInData[row.entrant_number]) {
                currentSignedInData[row.entrant_number] = [];
            }

            // Add the race_id if signed_in is true
            if (row.signed_in) {
                currentSignedInData[row.entrant_number].push(row.race_id);
            }
        });

        res.json(currentSignedInData);
    } catch (err) {
        console.error('Failed to fetch current signed_in data:', err);
        res.status(500).json({ message: 'Failed to fetch current signed_in data' });
    }
});

// Fetch and sort entrants by result
app.get('/entrants/:raceId/ordered_results', ensureAuthenticated, (req, res) => {
    const raceId = req.params.raceId;

    const sql = `
        SELECT *
        FROM entrants_events
        WHERE race_id = ?
    `;

    db.query(sql, [raceId], (err, results) => {
        if (err) {
            console.error('Error fetching entrants:', err);
            return res.status(500).json({ error: 'Error fetching entrants' });
        }

        // Sort the results in JavaScript
        results.sort((a, b) => {
            const resultA = parseResult(a.result);
            const resultB = parseResult(b.result);

            if (resultA.type === 'time' && resultB.type === 'time') {
                return resultA.value - resultB.value; // Ascending order for times
            } else if (resultA.type === 'distance' && resultB.type === 'distance') {
                return resultB.value - resultA.value; // Descending order for distances
            } else {
                // Handle cases where types are different if necessary
                // For simplicity, you could consider all times less than distances
                return resultA.type === 'time' ? -1 : 1;
            }
        });

        res.json(results);
    });
});

// Create a new event
app.post('/events', ensureAuthenticated, (req, res) => {
    const { name, age_group, gender, date, time, location, heat_size, price, description } = req.body;
    const sql = 'INSERT INTO events (age_group, gender, date, time, location, heat_size, price,  description, name, heats) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)';
    const values = [age_group, gender, date, time, location, heat_size, price, description, name];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Failed to create event:', err);
            return res.status(500).json({ message: 'Failed to create event' });
        }
        res.json({ message: 'Event created successfully', eventId: result.insertId });
    });
});

// Update an event
app.post('/events/update/:id', ensureAuthenticated, (req, res) => {
    const race_id = req.params.id;
    const details = req.body;

    const formattedDate = new Date(details.date).toISOString().split('T')[0];
    details.date = formattedDate;

    const sql = `
        UPDATE events
        SET name = ?, age_group = ?, gender = ?, date = ?, time = ?, location = ?, heat_size = ?, price = ?, description = ?
        WHERE race_id = ?;
    `;
    const values = [
        details.name,
        details.age_group,
        details.gender,
        details.date,
        details.time,
        details.location,
        details.heat_size,
        details.price,
        details.description,
        race_id
    ];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing query', err.stack);
            res.status(500).json({ error: 'Failed to update race' });
            return;
        }
        console.log('Race updated successfully');
        console.log('Number of affected rows:', result.affectedRows);
        if (result.affectedRows === 0) {
            console.warn('No rows were updated. Please check the race_id.');
        }
        res.status(200).json({ message: 'Race updated successfully' });
    });
});

// Updates an entrant's details
app.post('/entrants/update/:id', ensureAuthenticated, (req, res) => {
    const entrant_number = req.params.id;
    const details = req.body;

    const formattedDate = new Date(details.dob).toISOString().split('T')[0];
    details.dob = formattedDate;

    // Encrypt sensitive fields before storing them in the database
    const encryptedEmail = encrypt(details.email);
    const encryptedAddress = encrypt(details.address);
    const encryptedDob = encrypt(details.dob);
    const encryptedPhoneNumber = encrypt(details.phone_number);

    const sql = `
        UPDATE entrants
        SET forename = ?, surname = ?, gender = ?, dob = ?, club = ?, federation_member = ?, email = ?, phone_number = ?, address = ?, accepted = ?
        WHERE entrant_number = ?;
    `;
    const values = [
        details.forename,
        details.surname,
        details.gender,
        encryptedDob,
        details.club,
        details.federation_member,
        encryptedEmail,
        encryptedPhoneNumber,
        encryptedAddress,
        JSON.stringify(details.accepted),
        entrant_number
    ];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing query', err.stack);
            res.status(500).json({ error: 'Failed to update entrant details' });
            return;
        }
        console.log('Entrant details updated successfully');
        console.log('Number of affected rows:', result.affectedRows);
        if (result.affectedRows === 0) {
            console.warn('No rows were updated. Please check the entrant_number.');
        }
        res.status(200).json({ message: 'Entrant details updated successfully' });
    });
});

// Updates entrant's race PB
app.post('/pb/update', ensureAuthenticated, (req, res) => {
    const { entrant_number, race_id, pb } = req.body;
    if (!entrant_number || !race_id) {
        return res.status(400).json({ error: 'entrant_number, race_id, and pb are required' });
    }

    const sql = `
        UPDATE entrants_events
        SET pb = ?
        WHERE race_id = ? AND entrant_number = ?;
    `;
    const values = [pb, race_id, entrant_number];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Failed to update pb:', err);
            return res.status(500).json({ error: 'Error updating pb' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'No record found to update' });
        }
        res.json({ message: 'PB updated successfully' });
    });
});

// Add an entrant
app.post('/entrants/addentrants', ensureAuthenticated, (req, res) => {
    const { forename, surname, gender, dob, club, federation, email, phone, address, races } = req.body;

    // Encrypt sensitive fields before storing them in the database
    const encryptedEmail = encrypt(email);
    const encryptedAddress = encrypt(address);
    const encryptedDob = encrypt(dob);
    const encryptedPhoneNumber = encrypt(phone);

    const insertEntrantSql = `INSERT INTO entrants (forename, surname, gender, dob, club, federation_member, email, phone_number, address, accepted) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const entrantValues = [forename, surname, gender, encryptedDob, club, federation, encryptedEmail, encryptedPhoneNumber, encryptedAddress, '[]'];

    db.query(insertEntrantSql, entrantValues, (err, result) => {
        if (err) {
            console.error('Failed to add entrant:', err);
            return res.status(500).json({ message: 'Failed to add entrant' });
        }

        const entrantNumber = result.insertId;

        // Insert into join table
        const insertJoinSql = 'INSERT INTO entrants_events (entrant_number, race_id, signed_in, pb) VALUES ?';
        const joinValues = races.map(race => [entrantNumber, race.race_id, false, race.pb]);

        db.query(insertJoinSql, [joinValues], (err, result) => {
            if (err) {
                console.error('Failed to add entrant to events:', err);
                return res.status(500).json({ message: 'Failed to add entrant to events' });
            }

            res.json({ message: 'Entrant and associations added successfully', affectedRows: result.affectedRows });
        });
    });
});

// Sets the heats for a race
app.post('/heats/set', ensureAuthenticated, (req, res) => {
    const { heats, race } = req.body;
    if (!heats || !race || !race.race_id) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    const race_id = race.race_id;

    // SQL queries to delete existing heats and assignments
    const deleteAssignmentsSQL = `DELETE FROM heat_assignments WHERE race_id = ?;`;
    const deleteHeatsSQL = `DELETE FROM heats WHERE race_id = ?;`;

    db.beginTransaction((err) => {
        if (err) {
            console.error('Failed to start transaction:', err);
            return res.status(500).json({ error: 'Failed to start transaction' });
        }

        // Delete existing assignments
        db.query(deleteAssignmentsSQL, [race_id], (err, result) => {
            if (err) {
                console.error('Failed to delete existing assignments:', err);
                return db.rollback(() => {
                    res.status(500).json({ error: 'Failed to delete existing assignments' });
                });
            }

            // Delete existing heats
            db.query(deleteHeatsSQL, [race_id], (err, result) => {
                if (err) {
                    console.error('Failed to delete existing heats:', err);
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Failed to delete existing heats' });
                    });
                }

                // Insert new heats
                const insertHeatsSQL = `INSERT INTO heats (heat_id, race_id) VALUES ?`;
                const heatValues = heats.map((_, index) => [index + 1, race_id]);

                db.query(insertHeatsSQL, [heatValues], (err, result) => {
                    if (err) {
                        console.error('Failed to insert new heats:', err);
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Failed to insert new heats' });
                        });
                    }

                    // Insert new assignments
                    const insertAssignmentsSQL = `INSERT INTO heat_assignments (race_id, heat_id, entrant_number, pb, result) VALUES ?`;
                    const assignmentValues = [];
                    heats.forEach((heat, heatIndex) => {
                        heat.forEach(entrant => {
                            assignmentValues.push([race_id, heatIndex + 1, entrant.entrant_number, entrant.pb, null]);
                        });
                    });

                    db.query(insertAssignmentsSQL, [assignmentValues], (err, result) => {
                        if (err) {
                            console.error('Failed to insert new assignments:', err);
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Failed to insert new assignments' });
                            });
                        }

                        db.commit((err) => {
                            if (err) {
                                console.error('Failed to commit transaction:', err);
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Failed to commit transaction' });
                                });
                            }

                            const setHeatsSQL = 'UPDATE events SET heats = TRUE WHERE race_id = ?;';
                            db.query(setHeatsSQL, [race_id], (err, result) => {
                                if (err) {
                                    console.error('Failed to set heats = true:', err);
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Failed to set heats = true' });
                                    });
                                }    
                                res.status(200).json({ message: 'Heats and assignments updated successfully' });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Updates results for a race
app.post('/update-entrant-results', ensureAuthenticated, (req, res) => {
    const results = req.body;

    if (!Array.isArray(results)) {
        return res.status(400).json({ error: 'Invalid data format' });
    }

    const queries = results.map(result => {
        return new Promise((resolve, reject) => {
            const { race_id, entrant_number, result: entrantResult } = result;

            const sql = 'UPDATE entrants_events SET result = ? WHERE race_id = ? AND entrant_number = ?';
            db.query(sql, [entrantResult, race_id, entrant_number], (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    });

    Promise.all(queries)
        .then(results => {
            res.status(200).json({ message: 'Entrant results updated successfully' });
        })
        .catch(error => {
            console.error('Error updating entrant results:', error);
            res.status(500).json({ error: 'Error updating entrant results' });
        });
});

// Remove an entrant from a race
app.delete('/entrants/remove/:entrantId', ensureAuthenticated, (req, res) => {
    const entrantId = req.params.entrantId;
    const raceId = req.body.raceId;

    db.beginTransaction(err => {
        if (err) {
            console.error('Failed to start transaction:', err);
            return res.status(500).json({ message: 'Failed to start transaction' });
        }

        const sqlHeats = 'DELETE FROM heat_assignments WHERE entrant_number = ? AND race_id = ?';
        const sqlEvents = 'DELETE FROM entrants_events WHERE entrant_number = ? AND race_id = ?';

        db.query(sqlHeats, [entrantId, raceId], (err, result) => {
            if (err) {
                console.error('Failed to delete entrant from heats:', err);
                return db.rollback(() => {
                    res.status(500).json({ message: 'Failed to delete entrant from heats' });
                });
            }

            db.query(sqlEvents, [entrantId, raceId], (err, result) => {
                if (err) {
                    console.error('Failed to delete entrant from events:', err);
                    return db.rollback(() => {
                        res.status(500).json({ message: 'Failed to delete entrant from events' });
                    });
                }

                db.commit(err => {
                    if (err) {
                        console.error('Failed to commit transaction:', err);
                        return db.rollback(() => {
                            res.status(500).json({ message: 'Failed to commit transaction' });
                        });
                    }

                    res.json({ message: 'Entrant removed successfully', affectedRows: result.affectedRows });
                });
            });
        });
    });
});

// Delete entrant from entrant database
app.delete('/entrants/delete/full/:entrantId', ensureAuthenticated, (req, res) => {
    const entrantId = req.params.entrantId;

    // Start a transaction to ensure data integrity
    db.beginTransaction(err => {
        if (err) {
            console.error('Failed to start transaction:', err);
            return res.status(500).json({ message: 'Failed to start transaction' });
        }

        // First, delete related entries from the entrants_events table
        const deleteEntrantsEventsSql = 'DELETE FROM entrants_events WHERE entrant_number = ?';
        db.query(deleteEntrantsEventsSql, [entrantId], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Failed to delete related entries:', err);
                    res.status(500).json({ message: 'Failed to delete related entries' });
                });
            }

            // Then, delete the entrant from the entrants table
            const deleteEntrantSql = 'DELETE FROM entrants WHERE entrant_number = ?';
            db.query(deleteEntrantSql, [entrantId], (err, result) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Failed to delete entrant:', err);
                        res.status(500).json({ message: 'Failed to delete entrant' });
                    });
                }

                // Commit the transaction
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Failed to commit transaction:', err);
                            res.status(500).json({ message: 'Failed to commit transaction' });
                        });
                    }
                    res.json({ message: 'Entrant deleted successfully', affectedRows: result.affectedRows });
                });
            });
        });
    });
});

// Delete a race and its associated entrants
app.delete('/races/delete/:raceId', ensureAuthenticated, (req, res) => {
    const raceId = req.params.raceId;

    // First, delete all entries in the join table for the race
    const deleteJoinSql = 'DELETE FROM entrants_events WHERE race_id = ?';
    db.query(deleteJoinSql, [raceId], (err, result) => {
        if (err) {
            console.error('Failed to delete join entries:', err);
            return res.status(500).json({ message: 'Failed to delete join entries' });
        }

        // Then, delete the race
        const deleteRaceSql = 'DELETE FROM events WHERE race_id = ?';
        db.query(deleteRaceSql, [raceId], (err, result) => {
            if (err) {
                console.error('Failed to delete race:', err);
                return res.status(500).json({ message: 'Failed to delete race' });
            }
            res.json({ message: 'Race and associated entrants deleted successfully', affectedRows: result.affectedRows });
        });
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
