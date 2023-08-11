const mongoose = require('mongoose');

const connectToDatabase = () => {
    // Connect to database ***UPDATE WITH MONGODB LOGIN***
    mongoose.connect('mongodb+srv://membot:HO17rZFWx0XmFuHf@cluster0.txtdk0u.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('Could not connect to MongoDB', err));
}

module.exports = connectToDatabase;