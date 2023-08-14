const mongoose = require('mongoose');

// Create User Schema
const userSchema = new mongoose.Schema({
    discordId: { type: String, unique: true },
    walletAddress: { type: String, unique: true },
    encryptedPrivateKey: { type: Object, unique: true },
    password: { type: String },
    defaultSlippage: { type: String },
    maxGas: { type: String },
    maxFeePerGas: { type: String },
    maxPriorityFeePerGas: { type: String },
    gasLimit: { type: String },
    buyDelta: { type: String },
    sellDelta: { type: String },
    tokens: [{address: String, decimals: Number, symbol: String, name: String}]
});

const User = mongoose.model("User", userSchema);

module.exports = { User };
