import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://favkcgwfjosjlipgyohv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzM5NTAsImV4cCI6MjEwNzEwOTk1MH0.XnuS5-CNp3MxuCxs-jwBcizXFw_MqUuV2vcFi2W5pAk', // Anon key, but we'll use a raw REST call if needed, wait I have service role key in env
);

async function run() {
  const res = await fetch('https://favkcgwfjosjlipgyohv.supabase.co/rest/v1/', {
    headers: {
      apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzM5NTAsImV4cCI6MjEwNzEwOTk1MH0.XnuS5-CNp3MxuCxs-jwBcizXFw_MqUuV2vcFi2W5pAk',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdmtjZ3dmam9zamxpcGd5b2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTUzMzk1MCwiZXhwIjoyMTA3MTA5OTUwfQ.k1jG04T9X9Fv8HjH2Q-O8n4rX_g6fW_t0q1OQpE6YwY' // wait, the service role key from env is different?
    }
  });
}
