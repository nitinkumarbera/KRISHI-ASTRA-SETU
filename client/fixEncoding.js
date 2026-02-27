const fs = require('fs');
const iconv = require('iconv-lite');

const file = 'src/pages/Profile.jsx';
const text = fs.readFileSync(file, 'utf8');

// The file was saved as UTF-8 but its contents are Windows-1252 bytes that were decoded as UTF-8.
// By encoding the text back to Windows-1252, we get the original UTF-8 bytes!
const originalBytes = iconv.encode(text, 'win1252');

// Now decode those original UTF-8 bytes to actual characters
const fixedText = originalBytes.toString('utf8');

// The final text should still have the 'Rental_Started' intact because 'Rental_Started' is pure ASCII
// and won't be mangled by Windows-1252 <-> UTF-8 translations.

fs.writeFileSync(file, fixedText, 'utf8');
console.log('Fixed Profile.jsx encoding!');
