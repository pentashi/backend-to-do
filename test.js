const enteredPassword = 'daddy@123'; // Entered password during login
const storedHash = '$2b$10$qlpWjHw2UldjHIsX0fFpae.WQ.OcCj9H78CVbiDqOINizjetVXgee'; // Retrieved from DB

// Log the comparison result for debugging
const match = await bcrypt.compare(enteredPassword, storedHash);
console.log("Password Match from Manual Comparison:", match);
