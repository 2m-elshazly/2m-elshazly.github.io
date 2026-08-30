import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://egvocgzrlpbxcpktaqvv.supabase.co'
const supabaseKey = 'sb_publishable_T5epu5tgjf9YalRvpGx42Q_Bg4jk3im'
export const supabase = createClient(supabaseUrl, supabaseKey)

// دالة تسجيل الدخول بـ Google
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) console.error('خطأ في تسجيل الدخول:', error.message)
}