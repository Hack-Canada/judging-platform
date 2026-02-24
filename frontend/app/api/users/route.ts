import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { isAppRole } from "@/lib/rbac"

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

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null
  return authHeader.slice(7).trim() || null
}

async function requireSuperadmin(request: Request) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return { ok: false as const, response: NextResponse.json({ error: "Supabase public credentials not configured" }, { status: 500 }) }
  }

  const token = getBearerToken(request)
  if (!token) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const supabaseUserClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await supabaseUserClient.auth.getUser(token)
  if (error || !data.user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const roleCandidate =
    (data.user.user_metadata?.role as string | undefined) ??
    (data.user.app_metadata?.role as string | undefined) ??
    (data.user.user_metadata?.user_role as string | undefined)
  const role = isAppRole(roleCandidate) ? roleCandidate : null

  if (role !== "superadmin") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { ok: true as const, user: data.user }
}

export async function GET(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Admin access not configured" },
      { status: 500 }
    )
  }

  try {
    const authResult = await requireSuperadmin(request)
    if (!authResult.ok) return authResult.response

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
    const authResult = await requireSuperadmin(request)
    if (!authResult.ok) return authResult.response

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
      app_metadata?: Record<string, unknown>
      user_metadata?: Record<string, unknown>
    } = {}

    if (role === null || role === "") {
      // Remove role from metadata
      const { role: roleFromAppMetadata, ...appMetadataWithoutRole } = existingAppMetadata
      const { role: roleFromUserMetadata, ...userMetadataWithoutRole } = existingUserMetadata
      void roleFromAppMetadata
      void roleFromUserMetadata
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
