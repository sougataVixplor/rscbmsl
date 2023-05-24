
// let s='ABCD452 lsaa bn@3'

// let st=encodeURIComponent(s)

// console.log(st)


//Checking the crypto module
const crypto = require('crypto');
// const algorithm = 'aes-256-cbc'; //Using AES encryption
// const key = crypto.randomBytes(32);
// const iv = crypto.randomBytes(16);

// //Encrypting text
// function encrypt(text) {
//    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
//    let encrypted = cipher.update(text);
//    encrypted = Buffer.concat([encrypted, cipher.final()]);
//    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
// }

// // Decrypting text
// function decrypt(text) {
//    let iv = Buffer.from(text.iv, 'hex');
//    let encryptedText = Buffer.from(text.encryptedData, 'hex');
//    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
//    let decrypted = decipher.update(encryptedText);
//    decrypted = Buffer.concat([decrypted, decipher.final()]);
//    return decrypted.toString();
// }

// // Text send to encrypt function
// var hw = encrypt("Welcome to Tutorials Point...")
// console.log(hw)
// console.log(decrypt(hw))


const encryptData = (data) => {
    try {
      var encryptionMethod = "AES-256-CBC";
      var secret = "roAdvl!i$nk#freightroAdvl!i$nk#f";
      var iv = "1234567891011121";
      var encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
      return encryptor.update(data, "utf8", "base64") + encryptor.final("base64");
    } catch (error) {
      console.error("encryptData:: error in data encryption - ", error);
    }
  };
  
  const decryptData = (encryptedData) => {
    try {
      var encryptionMethod = "AES-256-CBC";
      var secret = "roAdvl!i$nk#freightroAdvl!i$nk#f";
      var iv = "1234567891011121";
      var decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
      return (
        decryptor.update(encryptedData, "base64", "utf8") +
        decryptor.final("utf8")
      );
    } catch (error) {
      console.error("decryptData:: error in encryptedData decryption - ", error);
    }
  };


let text= 'sample data'

endata=encryptData(text)

console.log(endata)

dedata=decryptData(endata)

console.log(dedata)

