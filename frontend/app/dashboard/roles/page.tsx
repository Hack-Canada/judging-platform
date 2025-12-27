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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

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
    [key: string]: any
  }
  raw_app_meta_data?: {
    role?: string
    [key: string]: any
  }
}

export default function RolesPage() {
  const [users, setUsers] = React.useState<AuthUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const isInitialLoad = React.useRef(true)

  const fetchUsers = React.useCallback(async (showLoading = false) => {
    try {
      if (showLoading || isInitialLoad.current) {
        setLoading(true)
      }
      
      // Fetch users from API route which uses Supabase Admin API
      const response = await fetch("/api/users")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch users")
      }

      if (result.users) {
        setUsers(result.users)
      }
      
      isInitialLoad.current = false
    } catch (error) {
      console.error("Failed to fetch users:", error)
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
  }, [fetchUsers])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
              <p className="text-muted-foreground">
                Manage user roles and permissions
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found in the authentication system.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Last Sign In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
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
                        {user.raw_user_meta_data?.role || user.raw_app_meta_data?.role ? (
                          <Badge variant="secondary">
                            {user.raw_user_meta_data?.role || user.raw_app_meta_data?.role}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No role</Badge>
                        )}
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

