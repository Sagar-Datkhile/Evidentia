import { createClient } from "@supabase/supabase-js";

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://favkcgwfjosjlipgyohv.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzM5NTAsImV4cCI6MjEwNzEwOTk1MH0.XnuS5-CNp3MxuCxs-jwBcizXFw_MqUuV2vcFi2W5pAk"
  );
  
  // Login as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "admin@evidentia.local", // Assuming this is the admin email
    password: "Password123!" // Assuming this is the password
  });

  if (authError) {
    console.log("AUTH ERROR:", authError);
    // If login fails, we can't test it.
    return;
  }

  const { data, error } = await supabase
      .from("case_assignments")
      .select("*, profiles!case_assignments_user_id_fkey(id, email, full_name, role)");

  console.log("DATA:", JSON.stringify(data, null, 2));
  console.log("ERROR:", error);
}

run();
