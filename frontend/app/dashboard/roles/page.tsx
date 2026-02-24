"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { getCurrentUserWithRole } from "@/lib/auth-helpers"
import { getDefaultRouteForRole } from "@/lib/rbac"
import { useRouter } from "next/navigation"

type AuthUser = {
  id: string
  email?: string
  created_at: string
  updated_at?: string
  last_sign_in_at?: string
  avatar_url?: string | null
  raw_user_meta_data?: {
    name?: string
    role?: string
    avatar_url?: string
    picture?: string
    [key: string]: unknown
  }
  raw_app_meta_data?: {
    role?: string
    [key: string]: unknown
  }
}

// Standard roles for the platform
const STANDARD_ROLES = [
  "hacker",
  "judge",
  "sponsor",
  "admin",
  "superadmin",
] as const

type StandardRole = typeof STANDARD_ROLES[number]

export default function RolesPage() {
  const router = useRouter()
  const [users, setUsers] = React.useState<AuthUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [authorized, setAuthorized] = React.useState(false)
  const [selectedRole, setSelectedRole] = React.useState<string>("all")
  const [updatingRoles, setUpdatingRoles] = React.useState<Set<string>>(new Set())
  const isInitialLoad = React.useRef(true)

  React.useEffect(() => {
    const checkAccess = async () => {
      const { role } = await getCurrentUserWithRole()
      if (role === "superadmin") {
        setAuthorized(true)
        return
      }
      if (role) {
        router.replace(getDefaultRouteForRole(role))
        return
      }
      router.replace("/login")
    }
    void checkAccess()
  }, [router])

  const fetchUsers = React.useCallback(async (showLoading = false) => {
    try {
      if (showLoading || isInitialLoad.current) {
        setLoading(true)
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Session expired. Please sign in again.")
      }
      
      // Fetch users from API route which uses Supabase Admin API
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch users")
      }

      if (result.users) {
        setUsers(result.users)
      }
      
      isInitialLoad.current = false
    } catch (error) {
      // Only show error toast on initial load or manual refresh
      if (isInitialLoad.current || showLoading) {
        toast.error("Failed to load users", {
          description: error instanceof Error ? error.message : "Unknown error",
        })
      }
      isInitialLoad.current = false
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!authorized) return

    // Initial fetch
    void fetchUsers(true)

    // Set up polling to refresh every 5 seconds (silent refresh)
    const intervalId = setInterval(() => {
      void fetchUsers(false)
    }, 5000)

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId)
    }
  }, [authorized, fetchUsers])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Extract unique roles from users, prioritizing standard roles
  const uniqueRoles = React.useMemo(() => {
    const standardRolesSet = new Set(STANDARD_ROLES)
    const standardRolesFound: string[] = []
    const otherRoles: string[] = []
    
    users.forEach((user) => {
      const role = user.raw_user_meta_data?.role || user.raw_app_meta_data?.role
      if (role) {
        if (standardRolesSet.has(role as StandardRole)) {
          if (!standardRolesFound.includes(role)) {
            standardRolesFound.push(role)
          }
        } else {
          if (!otherRoles.includes(role)) {
            otherRoles.push(role)
          }
        }
      }
    })
    
    // Sort standard roles by their order in STANDARD_ROLES, then add other roles sorted alphabetically
    const sortedStandardRoles = standardRolesFound.sort((a, b) => {
      const indexA = STANDARD_ROLES.indexOf(a as StandardRole)
      const indexB = STANDARD_ROLES.indexOf(b as StandardRole)
      return indexA - indexB
    })
    
    return [...sortedStandardRoles, ...otherRoles.sort()]
  }, [users])

  // Filter users based on selected role
  const filteredUsers = React.useMemo(() => {
    if (selectedRole === "all") {
      return users
    }
    if (selectedRole === "no-role") {
      return users.filter(
        (user) =>
          !user.raw_user_meta_data?.role && !user.raw_app_meta_data?.role
      )
    }
    return users.filter(
      (user) =>
        user.raw_user_meta_data?.role === selectedRole ||
        user.raw_app_meta_data?.role === selectedRole
    )
  }, [users, selectedRole])

  // Update user role
  const handleRoleUpdate = async (userId: string, newRole: string) => {
    setUpdatingRoles((prev) => new Set(prev).add(userId))
    
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("Session expired. Please sign in again.")
      }

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          role: newRole === "none" ? null : newRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update role")
      }

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              raw_user_meta_data: {
                ...user.raw_user_meta_data,
                role: newRole === "none" ? undefined : newRole,
              },
              raw_app_meta_data: {
                ...user.raw_app_meta_data,
                role: newRole === "none" ? undefined : newRole,
              },
            }
          }
          return user
        })
      )

      // Check if this is the current user and refresh their session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession?.user?.id === userId) {
        // Refresh the session to get updated metadata
        await supabase.auth.refreshSession()
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('userRoleUpdated', { 
          detail: { userId, role: newRole === "none" ? null : newRole } 
        }))
      } else {
        // Still dispatch event for other components that might need it
        window.dispatchEvent(new CustomEvent('userRoleUpdated', { 
          detail: { userId, role: newRole === "none" ? null : newRole } 
        }))
      }

      toast.success("Role updated successfully")
    } catch (error) {
      toast.error("Failed to update role", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setUpdatingRoles((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  if (!authorized) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking access...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
              <p className="text-muted-foreground mb-2">
                Manage user roles and permissions
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>How roles work:</strong> Roles are stored in Supabase user metadata and control access to different parts of the platform.
                </p>
                <p>
                  <strong>Standard roles:</strong>{" "}
                  {STANDARD_ROLES.map((role, idx) => (
                    <React.Fragment key={role}>
                      <code className="px-1 py-0.5 bg-muted rounded text-xs">{role}</code>
                      {idx < STANDARD_ROLES.length - 1 && ", "}
                    </React.Fragment>
                  ))}
                </p>
                <p>
                  Roles can be assigned using the dropdown in the Role column. Users without a role will display as &quot;No role&quot;.
                </p>
              </div>
            </div>

            {/* Role Filter */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="role-filter" className="text-sm font-medium">
                  Filter by Role:
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role-filter" className="w-[200px]">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="no-role">No role</SelectItem>
                    {STANDARD_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                    {/* Show other non-standard roles if they exist */}
                    {uniqueRoles
                      .filter((role) => !STANDARD_ROLES.includes(role as StandardRole))
                      .map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found in the authentication system.
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found with the selected role filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[200px]">Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Sign In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const name = user.raw_user_meta_data?.name || user.email?.split("@")[0] || "User"
                    const initials = name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                    const avatarUrl = user.avatar_url || user.raw_user_meta_data?.avatar_url || user.raw_user_meta_data?.picture
                    
                    return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={avatarUrl || undefined} alt={name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={user.raw_user_meta_data?.role || user.raw_app_meta_data?.role || "none"}
                          onValueChange={(value) => handleRoleUpdate(user.id, value)}
                          disabled={updatingRoles.has(user.id)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No role</SelectItem>
                            {STANDARD_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never"}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
