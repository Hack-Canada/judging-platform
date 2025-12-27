import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import type { Session } from "@supabase/supabase-js"

export function useAuth() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        if (!session) {
          router.push("/")
        }
      } catch (error) {
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    void checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        router.push("/")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return { session, loading, isAuthenticated: !!session }
}

