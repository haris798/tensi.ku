const fs = require('fs');
let code = fs.readFileSync('src/components/StatistikPanel.tsx', 'utf8');

code = code.replace(/BarChart, Bar/g, '');
code = code.replace(/import { format, subDays, startOfWeek, startOfMonth, isAfter, isSameMonth, parseISO } from 'date-fns';/g, "import { format, subDays, isSameMonth, parseISO } from 'date-fns';");
code = code.replace(/export const StatistikPanel: React.FC<Props> = \({ bpLogs, weightLogs }\) => {/g, "export const StatistikPanel: React.FC<Props> = ({ bpLogs }) => {");

fs.writeFileSync('src/components/StatistikPanel.tsx', code);
