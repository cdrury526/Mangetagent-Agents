import { createContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types/database';

export interface AuthContextType {
  session: Session | null;
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { name: string; brokerName: string; plan: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
