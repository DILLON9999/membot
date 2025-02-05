const mongoose = require('mongoose');

const connectToDatabase = () => {
    // Connect to database ***UPDATE WITH MONGODB LOGIN***
    mongoose.connect(process.env.MONGODB_LOGIN, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Could not connect to MongoDB', err));
}

module.exports = connectToDatabase;
