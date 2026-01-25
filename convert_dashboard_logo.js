
const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/suraj/.gemini/antigravity/brain/b90002bc-1e0e-487d-b3f0-aa1d25625817/uploaded_media_1769323452393.png';

try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = 'image/png'; // Assuming png based on extension
    const dataURI = `data:${mimeType};base64,${base64}`;

    fs.writeFileSync(path.join(__dirname, 'lib', 'dashboard-logo-data.ts'), `export const DASHBOARD_LOGO_DATA_URI = "${dataURI}";`);
    console.log("Successfully created lib/dashboard-logo-data.ts");
} catch (error) {
    console.error("Error reading file:", error);
}
