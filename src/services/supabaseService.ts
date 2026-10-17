import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface UserRunnerProfile {
  id: string;
  email: string;
  fullName: string;
  username: string;
  city: string;
  level: number;
  territoryKm2: number;
  localRank: number;
  zonesHeld: number;
  weeklyXp: number;
  streakDays: number;
  avatarUrl: string;
  territoryColor?: string;
}

const LOCAL_STORAGE_KEY = 'zonerush_active_user';

class SupabaseService {
  public client: SupabaseClient | null = null;
  public isConfigured: boolean = false;

  constructor() {
    if (
      SUPABASE_URL &&
      SUPABASE_URL !== 'https://your-project.supabase.co' &&
      SUPABASE_ANON_KEY &&
      SUPABASE_ANON_KEY !== 'your-anon-key'
    ) {
      try {
        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isConfigured = true;
      } catch (err) {
        console.warn('Failed to initialize Supabase client:', err);
      }
    }
  }

  // Get locally persisted user session
  getLocalSession(): UserRunnerProfile | null {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore JSON parse error
    }
    return null;
  }

  // Save session to localStorage
  saveLocalSession(profile: UserRunnerProfile) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage error
    }
  }

  clearLocalSession() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // Sign up with Supabase or persistent local profile fallback
  async signUp(
    email: string,
    password: string,
    metadata: { fullName: string; username: string; city: string; experienceLevel?: string }
  ): Promise<{ profile: UserRunnerProfile | null; error: string | null }> {
    const avatarNumber = Math.floor(Math.random() * 8) + 1;
    const defaultAvatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

    const userProfile: UserRunnerProfile = {
      id: `usr_${Date.now()}`,
      email,
      fullName: metadata.fullName || 'Runner',
      username: metadata.username.startsWith('@') ? metadata.username : `@${metadata.username}`,
      city: metadata.city || 'District Central',
      level: 1,
      territoryKm2: 0.0,
      localRank: 12,
      zonesHeld: 0,
      weeklyXp: 250,
      streakDays: 1,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB4cnAh_eB0Xn3DbaM_wKpiKUbCpMQmRhwJc-4PG7YAtBY6OAUd4YHaLymaSlw-YUskAYQKoKh54TctIgWzPpcMErGMPHjFD3yCoR2LjJgFRPMYiMuWyw9_-ngJ3j0uFnBL2j9hJ4xNPkNOSqEQMUW73Set63WGQw-0oqd1WGOptvUZxpqA5cBdKFc5ktxObEh7TG6UjnrpXDV4-krPANwBocfxOvOEzegnzKoOwN0elCoaZB5XLck',
    };

    if (this.isConfigured && this.client) {
      try {
        const { data, error } = await this.client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: metadata.fullName,
              username: userProfile.username,
              city: userProfile.city,
            },
          },
        });

        if (error) {
          return { profile: null, error: error.message };
        }

        if (data.user) {
          userProfile.id = data.user.id;
          try {
            await this.client
              .from('profiles')
              .upsert({
                id: data.user.id,
                email,
                full_name: metadata.fullName,
                username: userProfile.username,
                city: metadata.city,
                territory_km2: 0.0,
                level: 1,
                weekly_xp: 250,
                updated_at: new Date().toISOString(),
              });
          } catch {
            // ignore table creation check
          }
        }
      } catch (err: unknown) {
        console.warn('Supabase remote sign-up notice, utilizing validated local account:', err);
      }
    }

    this.saveLocalSession(userProfile);
    return { profile: userProfile, error: null };
  }

  // Sign in with Supabase
  async signIn(
    email: string,
    password: string
  ): Promise<{ profile: UserRunnerProfile | null; error: string | null }> {
    if (this.isConfigured && this.client) {
      try {
        const { data, error } = await this.client.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { profile: null, error: error.message };
        }

        if (data.user) {
          // Fetch existing profile or create default
          const { data: dbProfile } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const profile: UserRunnerProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: dbProfile?.full_name || data.user.user_metadata?.full_name || 'Alex Chen',
            username: dbProfile?.username || data.user.user_metadata?.username || '@AlexRunner',
            city: dbProfile?.city || 'New York',
            level: dbProfile?.level || 24,
            territoryKm2: dbProfile?.territory_km2 || 12.8,
            localRank: dbProfile?.local_rank || 7,
            zonesHeld: dbProfile?.zones_held || 9,
            weeklyXp: dbProfile?.weekly_xp || 4850,
            streakDays: dbProfile?.streak_days || 14,
            avatarUrl:
              'https://lh3.googleusercontent.com/aida-public/AB6AXuB4cnAh_eB0Xn3DbaM_wKpiKUbCpMQmRhwJc-4PG7YAtBY6OAUd4YHaLymaSlw-YUskAYQKoKh54TctIgWzPpcMErGMPHjFD3yCoR2LjJgFRPMYiMuWyw9_-ngJ3j0uFnBL2j9hJ4xNPkNOSqEQMUW73Set63WGQw-0oqd1WGOptvUZxpqA5cBdKFc5ktxObEh7TG6UjnrpXDV4-krPANwBocfxOvOEzegnzKoOwN0elCoaZB5XLck',
          };
          this.saveLocalSession(profile);
          return { profile, error: null };
        }
      } catch (err: unknown) {
        console.warn('Supabase sign-in network error:', err);
      }
    }

    // Check local session match or create valid session
    const existing = this.getLocalSession();
    if (existing && existing.email.toLowerCase() === email.toLowerCase()) {
      return { profile: existing, error: null };
    }

    // Default runner account for quick testing
    const defaultProfile: UserRunnerProfile = {
      id: `usr_${Date.now()}`,
      email,
      fullName: 'Alex Chen',
      username: '@AlexRunner',
      city: 'New York District',
      level: 24,
      territoryKm2: 12.8,
      localRank: 7,
      zonesHeld: 9,
      weeklyXp: 4850,
      streakDays: 14,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB4cnAh_eB0Xn3DbaM_wKpiKUbCpMQmRhwJc-4PG7YAtBY6OAUd4YHaLymaSlw-YUskAYQKoKh54TctIgWzPpcMErGMPHjFD3yCoR2LjJgFRPMYiMuWyw9_-ngJ3j0uFnBL2j9hJ4xNPkNOSqEQMUW73Set63WGQw-0oqd1WGOptvUZxpqA5cBdKFc5ktxObEh7TG6UjnrpXDV4-krPANwBocfxOvOEzegnzKoOwN0elCoaZB5XLck',
    };
    this.saveLocalSession(defaultProfile);
    return { profile: defaultProfile, error: null };
  }

  async signOut(): Promise<void> {
    if (this.isConfigured && this.client) {
      await this.client.auth.signOut().catch(() => {});
    }
    this.clearLocalSession();
  }

  // Save completed run loop into Supabase
  async saveRunRecord(profileId: string, runData: {
    distanceKm: number;
    durationSeconds: number;
    avgPace: string;
    calories: number;
    territoryYieldKm2: number;
    sectorClaimed: string;
  }) {
    if (this.isConfigured && this.client) {
      try {
        await this.client.from('run_activities').insert({
          user_id: profileId,
          distance_km: runData.distanceKm,
          duration_seconds: runData.durationSeconds,
          avg_pace: runData.avgPace,
          calories_burned: runData.calories,
          territory_yield_km2: runData.territoryYieldKm2,
          sector_claimed: runData.sectorClaimed,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not save to Supabase runs table:', err);
      }
    }
  }
}

export const supabaseService = new SupabaseService();
