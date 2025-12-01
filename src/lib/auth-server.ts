import { createClient } from '@supabase/supabase-js';
import { validateUUID } from './uuid-validation';

// Create a single Supabase client for server-side use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerClient() {
  // Create a basic client for server-side use
  // Note: In a real server component, you would use cookies() and headers()
  // But for now, we'll create a simple client that works in all contexts
  const clientConfig: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };
  
  return createClient(supabaseUrl, supabaseAnonKey, clientConfig);
}

// Helper function to get authenticated user on server
export async function getServerUser() {
  const supabase = createServerClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting server user:', error);
      
      // If getUser fails, try getSession as fallback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting server session:', sessionError);
        return null;
      }
      
      // Validate user ID before returning
      if (session?.user?.id) {
        try {
          validateUUID(session.user.id, 'user.id');
          return session.user;
        } catch (validationError) {
          console.error('Invalid user ID in session:', validationError);
          return null;
        }
      }
      
      return null;
    }
    
    // Validate user ID before returning
    if (user?.id) {
      try {
        validateUUID(user.id, 'user.id');
        return user;
      } catch (validationError) {
        console.error('Invalid user ID:', validationError);
        return null;
      }
    }
    
    return user;
  } catch (error) {
    console.error('Exception getting server user:', error);
    return null;
  }
}

// Helper function to check if user is authenticated on server
export async function requireServerAuth() {
  const user = await getServerUser();
  
  if (!user) {
    // This will be handled by the calling component
    // to show appropriate UI or redirect
    return null;
  }
  
  return user;
}

// Helper function to get session on server
export async function getServerSession() {
  const supabase = createServerClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting server session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Exception getting server session:', error);
    return null;
  }
}