let string = "1000000000000000000000000000.0";
const decimals = 18
let newString = string.slice(0, -(decimals+2));

console.log(newString); // Logs: "This is a very long string"
console.log('1000000000     000000000000000000.0')