import { createClient } from "@supabase/supabase-js";

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://favkcgwfjosjlipgyohv.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzM5NTAsImV4cCI6MjEwNzEwOTk1MH0.XnuS5-CNp3MxuCxs-jwBcizXFw_MqUuV2vcFi2W5pAk"
  );
  
  const query = "Sagar";
  const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, avatar_url")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq("is_active", true)
      .limit(20);

  console.log("SEARCH DATA:", data);
  console.log("SEARCH ERROR:", error);
}

run();
