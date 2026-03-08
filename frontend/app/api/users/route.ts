import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireSuperadmin } from "@/lib/api-auth"
import { isAppRole } from "@/lib/rbac"

// This route requires the Supabase service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create admin client with service role key
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

async function syncJudgeDirectoryUser(email: string, name: string) {
  if (!supabaseAdmin) {
    throw new Error("Admin access not configured")
  }

  const judgeName = name || email.split("@")[0]
  const { error } = await supabaseAdmin
    .from("judges")
    .upsert(
      {
        name: judgeName,
        email,
        tracks: ["General"],
        assigned_projects: 0,
        total_invested: 0,
      },
      { onConflict: "email" }
    )

  if (error) throw error
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

    if (role === "judge" || role === "sponsor") {
      await syncJudgeDirectoryUser(
        data.user.email || currentUser.user.email || "",
        (data.user.user_metadata?.name as string | undefined) ||
          (currentUser.user.user_metadata?.name as string | undefined) ||
          ""
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

export async function POST(request: Request) {
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
    const email = body.email?.trim().toLowerCase()
    const password = body.password?.trim() || ""
    const role = body.role?.trim()
    const name = body.name?.trim() || ""

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    if (!isAppRole(role)) {
      return NextResponse.json(
        { error: "A valid role is required" },
        { status: 400 }
      )
    }

    const requiresPin = role === "judge" || role === "sponsor"
    if (requiresPin) {
      if (!/^\d{6}$/.test(password)) {
        return NextResponse.json(
          { error: "Judge and sponsor accounts require a 6-digit PIN" },
          { status: 400 }
        )
      }
    } else if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      )
    }

    const existingUser = usersPage.users.find((user) => (user.email || "").toLowerCase() === email)
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: {
        role,
        ...(name ? { name } : {}),
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (role === "judge" || role === "sponsor") {
      try {
        await syncJudgeDirectoryUser(email, name)
      } catch (judgeError) {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id)
        return NextResponse.json(
          { error: judgeError instanceof Error ? judgeError.message : "Failed to sync judge directory" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at,
        last_sign_in_at: data.user.last_sign_in_at,
        avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
        raw_user_meta_data: data.user.user_metadata,
        raw_app_meta_data: data.user.app_metadata,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
