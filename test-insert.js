import { createClient } from "@supabase/supabase-js";

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://favkcgwfjosjlipgyohv.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzM5NTAsImV4cCI6MjEwNzEwOTk1MH0.XnuS5-CNp3MxuCxs-jwBcizXFw_MqUuV2vcFi2W5pAk"
  );
  
  const { data, error } = await supabase
      .from("case_assignments")
      .insert({
        case_id: "DUMMY",
        user_id: "00000000-0000-0000-0000-000000000000",
        assigned_role: "Police Officer",
        assigned_by: "00000000-0000-0000-0000-000000000000"
      });

  console.log("ERROR WITH ASSIGNED_BY:", error);
}

run();
