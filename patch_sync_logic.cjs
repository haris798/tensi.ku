const fs = require('fs');
let code = fs.readFileSync('src/lib/syncEngine.ts', 'utf8');

const targetBPAdd = `      case 'ADD_BP': {
        const { error } = await client
          .from('blood_pressure_logs')
          .upsert(payload); // Use upsert to handle potential duplicate retries
        if (error) throw error;
        break;
      }`;
      
const replaceBPAdd = `      case 'ADD_BP': {
        const payloadForDb = { ...payload };
        if (typeof payloadForDb.id === 'string') delete payloadForDb.id;
        const { error } = await client
          .from('blood_pressure_logs')
          .insert(payloadForDb);
        if (error) throw error;
        break;
      }`;

const targetBPDel = `      case 'DELETE_BP': {
        const { error } = await client
          .from('blood_pressure_logs')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
        break;
      }`;
      
const replaceBPDel = `      case 'DELETE_BP': {
        if (typeof payload.id === 'string') break; // Local only
        const { error } = await client
          .from('blood_pressure_logs')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
        break;
      }`;

const targetWAdd = `      case 'ADD_WEIGHT': {
        const { error } = await client
          .from('weight_logs')
          .upsert(payload);
        if (error) throw error;
        break;
      }`;

const replaceWAdd = `      case 'ADD_WEIGHT': {
        const payloadForDb = { ...payload };
        if (typeof payloadForDb.id === 'string') delete payloadForDb.id;
        const { error } = await client
          .from('weight_logs')
          .insert(payloadForDb);
        if (error) throw error;
        break;
      }`;

const targetWDel = `      case 'DELETE_WEIGHT': {
        const { error } = await client
          .from('weight_logs')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
        break;
      }`;

const replaceWDel = `      case 'DELETE_WEIGHT': {
        if (typeof payload.id === 'string') break; // Local only
        const { error } = await client
          .from('weight_logs')
          .delete()
          .eq('id', payload.id);
        if (error) throw error;
        break;
      }`;

code = code.replace(targetBPAdd, replaceBPAdd);
code = code.replace(targetBPDel, replaceBPDel);
code = code.replace(targetWAdd, replaceWAdd);
code = code.replace(targetWDel, replaceWDel);

fs.writeFileSync('src/lib/syncEngine.ts', code);
console.log('syncEngine updated');
