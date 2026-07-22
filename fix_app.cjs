const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove unused icons
code = code.replace(/  LogOut,\n/g, '');
code = code.replace(/  Info,\n/g, '');
code = code.replace(/  ChevronDown,\n/g, '');

// 2. Fix w
code = code.replace(/const w = parseFloat\(weightInput\);/g, 'const _w = parseFloat(weightInput);');

// 3. Fix setIsLoading
code = code.replace(/const \[isLoading, setIsLoading\] = useState\(false\);/g, 'const [isLoading] = useState(false);');

// 4. Fix isEditingProfile
code = code.replace(/const \[isEditingProfile, setIsEditingProfile\] = useState\(false\);/g, 'const [, setIsEditingProfile] = useState(false);');

// 5. Fix newTip
code = code.replace(/const newTip: AITipLog = {/g, 'const _newTip: AITipLog = {');

// 6. Fix useDemoMode
code = code.replace(/useDemoMode = false/g, '_useDemoMode = false');

fs.writeFileSync('src/App.tsx', code);
