const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `      const currentFullName = profile?.full_name || "Pengguna";
      let userId: string | undefined;

      const { data: existingProfile, error: searchErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("full_name", currentFullName)
        .maybeSingle();

      if (existingProfile) {
        userId = existingProfile.id;
      } else if (!searchErr) {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            full_name: currentFullName,
            height: profile?.height || null,
            target_weight: profile?.target_weight || null,
          })
          .select("id")
          .single();
        if (newProfile) userId = newProfile.id;
      }`;

const replacement = `      const currentFullName = profile?.full_name || "Pengguna";
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
          // Attempt to insert profile, ignoring unique name conflicts if any
          await supabase
            .from("profiles")
            .insert({
              id: userId,
              full_name: currentFullName + (Math.random().toString(36).substring(2,6)), // avoid unique constraint initially
              height: profile?.height || null,
              target_weight: profile?.target_weight || null,
            });
        }
      }`;

code = code.replaceAll(target1, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('Patched auth in App.tsx');
