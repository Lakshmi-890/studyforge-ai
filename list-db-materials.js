const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function run() {
  const { data, error } = await supabase.from('materials').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log("Materials in DB:");
    data.forEach(m => {
      console.log(`- ID: ${m.id}, Filename: ${m.filename}, Path: ${m.storage_path}, Status: ${m.processing_status}`);
    });
  }
}
run();
