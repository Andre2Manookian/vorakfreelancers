import { supabase } from './supabase'

export async function createNotification(userId, type, title, message, link) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link,
      is_read: false
    })
    if (error) throw error
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}
