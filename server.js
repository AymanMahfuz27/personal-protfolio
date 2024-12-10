const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/submit-form', (req, res) => {
    const { name, email, message } = req.body;

    // Save form data to a file (or database)
    const logData = `Name: ${name}, Email: ${email}, Message: ${message}\n`;
    fs.appendFileSync(path.join(__dirname, 'submissions.log'), logData);

    res.send('Form submitted successfully!');
});

// Serve static files
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
