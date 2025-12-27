import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This route requires the Supabase service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  // Supabase admin credentials missing
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
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      raw_user_meta_data: user.user_metadata,
      raw_app_meta_data: user.app_metadata,
    })) || []

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Admin access not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { userId, role } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // First, get the current user to preserve existing metadata
    const { data: currentUser, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (fetchError || !currentUser.user) {
      return NextResponse.json(
        { error: fetchError?.message || "User not found" },
        { status: 404 }
      )
    }

    // Merge with existing metadata
    const existingAppMetadata = currentUser.user.app_metadata || {}
    const existingUserMetadata = currentUser.user.user_metadata || {}

    const updateData: {
      app_metadata?: Record<string, any>
      user_metadata?: Record<string, any>
    } = {}

    if (role === null || role === "") {
      // Remove role from metadata
      const { role: _, ...appMetadataWithoutRole } = existingAppMetadata
      const { role: __, ...userMetadataWithoutRole } = existingUserMetadata
      updateData.app_metadata = appMetadataWithoutRole
      updateData.user_metadata = userMetadataWithoutRole
    } else {
      // Add/update role in metadata
      updateData.app_metadata = {
        ...existingAppMetadata,
        role: role,
      }
      updateData.user_metadata = {
        ...existingUserMetadata,
        role: role,
      }
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    )

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        app_metadata: data.user.app_metadata,
        user_metadata: data.user.user_metadata,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

