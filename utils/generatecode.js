const crypto = require("crypto");

const generateCode = () => {
    // Generate 6 random alphanumeric characters
    // Using hex from random bytes, replacing anything non-alphanumeric, and slicing to 6
    // Better: use a defined character set to avoid zeros and Os if desired, but crypto randomBytes is fast
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    const randomBytes = crypto.randomBytes(6);
    
    for (let i = 0; i < 6; i++) {
        // Use modulo to safely grab an index from our char set
        code += chars[randomBytes[i] % chars.length];
    }
    
    return code;
};

module.exports = generateCode;
