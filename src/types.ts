export type User = {
  id: string;
  phone: string;
  created_at: string;
};

export type Album = {
  id: string;
  user_id: string;
  name: string;
  status: 'editing' | 'finished' | 'approved';
  total_pages: number;
  created_at: string;
};

export type Photo = {
  id: string;
  user_id: string;
  url: string;
  thumbnail_url: string;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  photo_id: string;
};

export type AlbumPage = {
  id: string;
  album_id: string;
  page_number: number;
};

export type AlbumItem = {
  id: string;
  page_id: string;
  photo_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
};

export type Plan = {
  id: string;
  name: string;
  max_photos: number;
  max_pages: number;
};

export type Coupon = {
  id: string;
  code: string;
  discount: number;
};
