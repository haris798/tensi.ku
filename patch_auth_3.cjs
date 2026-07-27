const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const currentFullName = profile\?\.full_name \|\| "Pengguna";[\s\S]*?if \(!?userId\) \{/g;

const replacement = `const currentFullName = profile?.full_name || "Pengguna";
      let userId: string | undefined;

      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        
        const { data: existingProfile, error: searchErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existingProfile && !searchErr) {
          await supabase
            .from("profiles")
            .insert({
              id: userId,
              full_name: currentFullName + (Math.random().toString(36).substring(2,6)),
              height: profile?.height || null,
              target_weight: profile?.target_weight || null,
            });
        }
      }
      
      if (!userId) {
        // Fallback for handleBackgroundSync / handleManualSync conditional block start (will fix bracket separately if needed)
        // Actually, the original logic had either "if (userId) {" or "if (!userId) {"
        `;

code = code.replace(regex, (match) => {
  const isNegated = match.includes("if (!userId) {");
  return `const currentFullName = profile?.full_name || "Pengguna";
      let userId: string | undefined;

      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        
        const { data: existingProfile, error: searchErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (!existingProfile && !searchErr) {
          await supabase
            .from("profiles")
            .insert({
              id: userId,
              full_name: currentFullName + (Math.random().toString(36).substring(2,6)),
              height: profile?.height || null,
              target_weight: profile?.target_weight || null,
            });
        }
      }
      
      if (${isNegated ? '!userId' : 'userId'}) {`;
});

fs.writeFileSync('src/App.tsx', code);
console.log('Patched App.tsx auth blocks');
