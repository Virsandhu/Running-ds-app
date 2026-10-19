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

// Row shape of public.profiles (see SUPABASE_BACKEND_SETUP_GUIDE.md)
interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  username: string;
  city: string | null;
  avatar_url: string | null;
  territory_color: string | null;
  territory_km2: number | string | null;
  local_rank: number | null;
  zones_held: number | null;
  weekly_xp: number | null;
}

export interface AreaLeaderboardEntry {
  id: string;
  rank: number;
  fullName: string;
  username: string;
  avatarUrl: string;
  territoryColor: string;
  territoryKm2: number;
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

  isDemoProfile(profile: UserRunnerProfile | null): boolean {
    return Boolean(profile?.id.startsWith('demo_'));
  }

  // Map a public.profiles row (or auth metadata when the row is missing) to the app profile
  private toRunnerProfile(user: User, row: ProfileRow | null): UserRunnerProfile {
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: row?.email || user.email || '',
      fullName: row?.full_name || meta.full_name || 'Runner',
      username: row?.username || meta.username || '@Runner',
      city: row?.city || meta.city || 'The Doon School, Dehradun',
      level: 1,
      territoryKm2: Number(row?.territory_km2 ?? 0),
      localRank: row?.local_rank ?? 10,
      zonesHeld: row?.zones_held ?? 0,
      weeklyXp: row?.weekly_xp ?? 0,
      streakDays: 1,
      avatarUrl: row?.avatar_url || meta.avatar_url || '⚡',
      territoryColor: row?.territory_color || undefined,
    };
  }

  private async fetchProfile(user: User): Promise<UserRunnerProfile> {
    const { data: row, error } = await this.client!
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle<ProfileRow>();
    if (error) {
      console.warn('Could not load runner profile:', error.message);
    }
    const profile = this.toRunnerProfile(user, row ?? null);
    this.saveLocalSession(profile);
    return profile;
  }

  // Restore the signed-in runner from the persisted Supabase session
  async getSessionProfile(): Promise<UserRunnerProfile | null> {
    if (!this.isConfigured || !this.client) {
      return this.getLocalSession();
    }
    const { data } = await this.client.auth.getSession();
    if (!data.session) {
      return null;
    }
    return this.fetchProfile(data.session.user);
  }

  // Notifies when the Supabase session ends (sign-out elsewhere, expired refresh token)
  onSignedOut(callback: () => void): () => void {
    if (!this.isConfigured || !this.client) {
      return () => {};
    }
    const { data } = this.client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        callback();
      }
    });
    return () => data.subscription.unsubscribe();
  }

  // Sign up with Supabase, or a local profile when Supabase is not configured
  async signUp(
    email: string,
    password: string,
    metadata: { fullName: string; username: string; city: string; experienceLevel?: string }
  ): Promise<{ profile: UserRunnerProfile | null; error: string | null; needsEmailConfirmation?: boolean }> {
    const username = metadata.username.startsWith('@') ? metadata.username : `@${metadata.username}`;

    if (this.isConfigured && this.client) {
      try {
        // The on_auth_user_created trigger creates the public.profiles row from this metadata
        const { data, error } = await this.client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: metadata.fullName,
              username,
              city: metadata.city,
            },
          },
        });

        if (error) {
          return { profile: null, error: error.message };
        }
        if (!data.user) {
          return { profile: null, error: 'Sign-up failed. Please try again.' };
        }
        // Email confirmation is enabled: no session until the link is clicked
        if (!data.session) {
          return { profile: null, error: null, needsEmailConfirmation: true };
        }
        return { profile: await this.fetchProfile(data.user), error: null };
      } catch (err: unknown) {
        return { profile: null, error: err instanceof Error ? err.message : 'Could not reach Supabase.' };
      }
    }

    const userProfile: UserRunnerProfile = {
      id: `usr_${Date.now()}`,
      email,
      fullName: metadata.fullName || 'Runner',
      username,
      city: metadata.city || 'The Doon School, Dehradun',
      level: 1,
      territoryKm2: 0.0,
      localRank: 12,
      zonesHeld: 0,
      weeklyXp: 250,
      streakDays: 1,
      avatarUrl: '⚡',
    };
    this.saveLocalSession(userProfile);
    return { profile: userProfile, error: null };
  }

  // Sign in with Supabase, or the local profile when Supabase is not configured
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
        return { profile: await this.fetchProfile(data.user), error: null };
      } catch (err: unknown) {
        return { profile: null, error: err instanceof Error ? err.message : 'Could not reach Supabase.' };
      }
    }

    const existing = this.getLocalSession();
    if (existing && existing.email.toLowerCase() === email.toLowerCase()) {
      return { profile: existing, error: null };
    }
    return {
      profile: null,
      error: 'Accounts are unavailable: this version of the app is not connected to Supabase. Use the demo runner, or create an offline account on this device.',
    };
  }

  // Persist avatar / territory color changes to public.profiles (scores are server-computed)
  async updateProfile(
    profile: UserRunnerProfile,
    fields: { avatarUrl?: string; territoryColor?: string }
  ): Promise<void> {
    this.saveLocalSession({ ...profile, ...fields });
    if (!this.isConfigured || !this.client || this.isDemoProfile(profile)) {
      return;
    }
    const { error } = await this.client
      .from('profiles')
      .update({
        ...(fields.avatarUrl !== undefined && { avatar_url: fields.avatarUrl }),
        ...(fields.territoryColor !== undefined && { territory_color: fields.territoryColor }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
    if (error) {
      console.warn('Could not update runner profile:', error.message);
    }
  }

  // All runners ranked by total territory claimed; equal areas share a rank
  async fetchAreaLeaderboard(): Promise<AreaLeaderboardEntry[] | null> {
    if (!this.isConfigured || !this.client) {
      return null;
    }
    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, username, avatar_url, territory_color, territory_km2')
      .order('territory_km2', { ascending: false })
      .order('full_name', { ascending: true })
      .limit(1000);
    if (error) {
      console.warn('Could not load leaderboard:', error.message);
      return null;
    }
    return rankByArea(
      data.map((row) => ({
        id: row.id,
        fullName: row.full_name,
        username: row.username,
        avatarUrl: row.avatar_url || '⚡',
        territoryColor: row.territory_color || '#2563EB',
        territoryKm2: Number(row.territory_km2 ?? 0),
      }))
    );
  }

  async signOut(): Promise<void> {
    if (this.isConfigured && this.client) {
      await this.client.auth.signOut().catch(() => {});
    }
    this.clearLocalSession();
  }

  // Save completed run loop into public.runs; the server validates it and recomputes
  // distance, area and the runner's totals, then returns the refreshed profile
  async saveRunRecord(profile: UserRunnerProfile, runData: {
    distanceKm: number;
    durationSeconds: number;
    avgPace: string;
    calories: number;
    displacementMeters: number;
    territoryYieldKm2: number;
    sectorClaimed: string;
    polygonPaths: { lat: number; lng: number }[];
    rawGpsTrail: { lat: number; lng: number }[];
  }): Promise<{ profile: UserRunnerProfile | null; error: string | null }> {
    if (!this.isConfigured || !this.client || this.isDemoProfile(profile)) {
      return { profile: null, error: null };
    }
    const { error } = await this.client.from('runs').insert({
      runner_id: profile.id,
      distance_km: runData.distanceKm,
      duration_seconds: runData.durationSeconds,
      avg_pace: runData.avgPace,
      calories: runData.calories,
      displacement_meters: runData.displacementMeters,
      territory_yield_km2: runData.territoryYieldKm2,
      sector_claimed: runData.sectorClaimed,
      polygon_paths: runData.polygonPaths,
      raw_gps_trail: runData.rawGpsTrail,
    });
    if (error) {
      console.warn('Run rejected by server:', error.message);
    }
    return { profile: await this.getSessionProfile(), error: error?.message ?? null };
  }
}

// Sort by area (largest first) and assign competition ranks: 1, 2, 2, 4
export function rankByArea(entries: Omit<AreaLeaderboardEntry, 'rank'>[]): AreaLeaderboardEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.territoryKm2 - a.territoryKm2 || a.fullName.localeCompare(b.fullName)
  );
  let rank = 0;
  return sorted.map((entry, i) => {
    if (i === 0 || entry.territoryKm2 !== sorted[i - 1].territoryKm2) {
      rank = i + 1;
    }
    return { ...entry, rank };
  });
}

export const supabaseService = new SupabaseService();
