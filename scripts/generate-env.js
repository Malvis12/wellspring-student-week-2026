const fs = require("fs");
const path = require("path");

const voteApiUrl = process.env.VOTE_API_URL || "/.netlify/functions/verify-vote";
const contents = `window.VOTE_API_URL = ${JSON.stringify(voteApiUrl)};`;

// Write to root (for index.html)
const rootEnv = path.resolve(__dirname, "../env.js");
fs.writeFileSync(rootEnv, contents, "utf8");
console.log("Generated env.js with VOTE_API_URL=" + voteApiUrl);

// Write to Admin/ (for Admin/dashboard.html which loads ./env.js)
const adminEnv = path.resolve(__dirname, "../Admin/env.js");
fs.writeFileSync(adminEnv, contents, "utf8");
console.log("Generated Admin/env.js with VOTE_API_URL=" + voteApiUrl);
