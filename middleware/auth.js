const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization"); // Extract the Authorization header
    if (!authHeader) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // Extract the token after "Bearer "
    const token = authHeader.split(" ")[1]; 
    if (!token) {
        return res.status(401).json({ message: "Access denied. Invalid token format." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Attach verified user to the request object
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid token." });
    }
};

module.exports = authenticateToken;
