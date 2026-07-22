const fs = require('fs');
let code = fs.readFileSync('src/components/SupabaseConfigModal.tsx', 'utf8');

// The original was {!currentIsDemo && ( <div className="border-t ...> ... </div> )}
// We replaced it with `(` and now there is `)}` at the end.
code = code.replace(/\{!currentIsDemo && \(/g, '(');
// Actually I did this already.
// Now I need to remove `)` and `}` at line 171.
code = code.replace(/            <\/div>\n          \)}/g, '            </div>');

fs.writeFileSync('src/components/SupabaseConfigModal.tsx', code);
