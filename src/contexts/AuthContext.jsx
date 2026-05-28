import {
  createContext, useContext,
  useState, useEffect
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [bannedProfile, setBannedProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    if (!userId) return null
    try {
      const { data } = await supabase
        .from('users')
        .select('*, talent_profiles(*)')
        .eq('id', userId)
        .maybeSingle()

      if (data?.is_suspended) {
        const expired = data.ban_expires_at && new Date(data.ban_expires_at) < new Date()
        if (expired) {
          // Auto-lift expired ban
          await supabase
            .from('users')
            .update({ is_suspended: false, ban_expires_at: null, ban_message: null })
            .eq('id', userId)
          data.is_suspended = false
          data.ban_expires_at = null
          data.ban_message = null
        } else {
          // Still banned — sign out and show ban screen
          setBannedProfile(data)
          await supabase.auth.signOut()
          setCurrentUser(null)
          setUserProfile(null)
          return null
        }
      }

      // Merge talent_profiles fields into userProfile for easy access
      let profile = data
      if (data?.role === 'talent') {
        const tp = data.talent_profiles?.[0]
        if (tp) {
          profile = {
            ...data,
            category: tp.category,
            skills: tp.skills || [],
            languages: tp.languages || [],
            hourly_rate: tp.hourly_rate,
            tagline: tp.tagline,
            is_available: tp.availability === 'available',
            rating_avg: tp.rating_avg,
            total_reviews: tp.total_reviews,
            total_orders: tp.total_orders,
            portfolio_items: tp.portfolio_items,
          }
        }
      }

      if (profile) setUserProfile(profile)
      return profile
    } catch (err) {
      console.error('fetchProfile:', err)
      return null
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(
      ({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser(session.user)
          fetchProfile(session.user.id)
            .finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      }
    )

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setCurrentUser(session.user)
            fetchProfile(session.user.id)
          }
          if (event === 'SIGNED_OUT') {
            setCurrentUser(null)
            setUserProfile(null)
          }
        }
      )
    return () => subscription.unsubscribe()
  }, [])

  async function signup(email, password,
    fullName, role) {
    const { data, error } = await
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName, role }
        }
      })
    if (error) throw error
    if (!data.user) throw new Error('Signup failed')

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role,
        created_at: new Date().toISOString()
      })
    if (insertError) {
      console.error('Insert error:', insertError)
    }

    // Create talent_profiles row so talent appears on Browse Talent immediately
    if (role === 'talent') {
      await supabase
        .from('talent_profiles')
        .insert({
          user_id: data.user.id,
          skills: [],
          languages: [],
          availability: 'available',
        })
    }

    return data
  }

  async function logout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setUserProfile(null)
    window.location.href = '/'
  }

  async function updateProfile(updates) {
    if (!currentUser) return
    await supabase
      .from('users')
      .update(updates)
      .eq('id', currentUser.id)
    await fetchProfile(currentUser.id)
  }

  async function refreshProfile() {
    if (!currentUser) return
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle()
    if (data) setUserProfile(data)
    return data
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      isTalent: userProfile?.role === 'talent',
      bannedProfile,
      setBannedProfile,
      loading,
      signup,
      logout,
      updateProfile,
      fetchProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 
