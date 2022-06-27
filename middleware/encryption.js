const crypto = require('crypto');

//Encrypting text
function encrypt(text, algorithm, key, iv) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}   
 
// Decrypting text
function decrypt(text, algorithm, key, iv) {
    const algorithm = 'aes-256-cbc'; 
    const key = process.env.SECRET_KEY;
    const iv = crypto.randomBytes(16);
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {encrypt, decrypt};