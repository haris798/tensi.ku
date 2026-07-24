const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /if \(apiKey\) \{/g,
  `if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {`
);

fs.writeFileSync('server.ts', code);
