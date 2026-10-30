const fs = require("fs");
const path = require("path");

const outputDirectory = path.join(__dirname, "dist");
const files = [
    "index.html",
    "login.html",
    "auth.js",
    "supabase.js",
    "script.js",
    "style.css",
    "schema.sql"
];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });

for (const file of files) {
    fs.copyFileSync(path.join(__dirname, file), path.join(outputDirectory, file));
}
