const fs = require('fs');
let code = fs.readFileSync('src/lib/localDb.ts', 'utf8');

code = code.replace("full_name: 'Budi Santoso (Demo)',", "full_name: 'Haris',");
code = code.replace("target_weight: 68.0,", "target_weight: 75.0,");
code = code.replace("height: 170.0,", "height: 172.0,");

code = code.replace(/HAS_SEEDED: 'local_has_seeded_v1'/g, "HAS_SEEDED: 'local_has_seeded_v2'");

fs.writeFileSync('src/lib/localDb.ts', code);
