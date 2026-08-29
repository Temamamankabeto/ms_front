export type City = {
  id: number;
  name: string;
  code?: string;
};

export type Subcity = {
  id: number;
  name: string;
  city_id: number;
  city?: City;
};

export type Woreda = {
  id: number;
  name: string;
  subcity_id: number;
  subcity?: Subcity;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};