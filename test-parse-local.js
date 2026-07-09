// test-parse-local.js
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config' // idi .env.local ni chadutundi

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Testing Supabase connection...")
  const { data, error } = await supabase.from('your_table_name').select('*').limit(1)

  if (error) {
    console.error("Error:", error)
  } else {
    console.log("Success! Data:", data)
  }
}

test()