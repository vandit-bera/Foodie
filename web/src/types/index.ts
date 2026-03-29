/** Shared TypeScript interfaces matching backend Pydantic schemas. */

export interface UserPublic {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface UserPrivate extends UserPublic {
  email: string;
  bio: string | null;
  post_count: number;
  created_at: string;
}

export interface ImageItem {
  url: string;
  order: number;
}

export interface PostCard {
  id: string;
  user: UserPublic;
  food_name: string;
  restaurant_name: string;
  price: number | null;
  caption: string | null;
  location_name: string | null;
  city: string | null;
  images: ImageItem[];
  like_count: number;
  comment_count: number;
  share_count: number;
  liked_by_me: boolean;
  distance_km: number | null;
  created_at: string;
}

export interface PostDetail extends PostCard {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CommentOut {
  id: string;
  post_id: string;
  user: UserPublic;
  body: string;
  parent_id: string | null;
  reply_count: number;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

export interface TokenResponse {
  user: UserPrivate;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LikeResponse {
  liked: boolean;
  like_count: number;
}
