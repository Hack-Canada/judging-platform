import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This route requires the Supabase service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase admin credentials missing")
}

// Create admin client with service role key
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Admin access not configured" },
      { status: 500 }
    )
  }

  try {
    // Fetch all users from auth.users using admin API
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform the users to include relevant information
    const formattedUsers = users?.map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      raw_user_meta_data: user.user_metadata,
      raw_app_meta_data: user.app_metadata,
    })) || []

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

