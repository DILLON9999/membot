const mongoose = require('mongoose');

// Create User Schema
const userSchema = new mongoose.Schema({
    discordId: { type: String, unique: true },
    walletAddress: { type: String, unique: true },
    encryptedPrivateKey: { type: Object, unique: true },
    password: { type: String, unique: true },
    defaultSlippage: { type: String, unique: true },
    maxFeePerGas: { type: String, unique: true },
    maxPriorityFeePerGas: { type: String, unique: true },
    gasLimit: { type: String, unique: true },
    buyDelta: { type: String, unique: true },
    sellDelta: { type: String, unique: true }
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
