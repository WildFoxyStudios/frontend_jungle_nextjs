export interface AuthUser {
  id: number;
  uuid: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  avatar: string;
  is_verified: boolean;
  is_pro: number;
  is_admin: boolean;
  two_factor_enabled: boolean;
  email_verified: boolean;
  /**
   * `true` if the account has a local email+password credential. OAuth-only
   * users should call `authApi.setSocialPassword` before `authApi.changePassword`.
   */
  has_password: boolean;
}

export interface User {
  id: number;
  uuid: string;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  avatar: string;
  cover: string;
  about: string;
  email: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  website?: string;
  location?: string;
  working?: string;
  school?: string;
  two_factor_enabled?: boolean;
  email_verified?: boolean;
  is_verified: boolean;
  is_pro: number;
  is_online: boolean;
  is_admin: boolean;
  is_banned: boolean;
  is_following?: boolean;
  is_blocked?: boolean;
  is_muted?: boolean;
  open_to_work?: { title: string; skills: string[] } | null;
  providing_service?: { title: string; description: string } | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  last_seen: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    vk?: string;
    tiktok?: string;
    website?: string;
  };
  created_at: string;
  updated_at: string;
}

export type PublicUser = Pick<
  User,
  | "id"
  | "uuid"
  | "username"
  | "first_name"
  | "last_name"
  | "avatar"
  | "is_verified"
  | "is_online"
  | "is_pro"
> & {
  distance_km?: number;
};

export interface UserSession {
  id: string;
  device: string;
  ip: string;
  location?: string;
  last_seen: string;
  is_current: boolean;
}

export interface UserExperience {
  id: number;
  title: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
}

export interface UserCertification {
  id: number;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface UserSkill {
  id: number;
  name: string;
  endorsement_count: number;
}

export interface CustomProfileField {
  id: number;
  name: string;
  type: "text" | "url" | "date" | "select";
  value: string;
}

export interface UserProject {
  id: number;
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
  created_at: string;
}
