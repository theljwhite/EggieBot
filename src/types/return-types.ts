//TODO - update these types

export type ServersListData = {
  customs: CustomsShape;
  pickup_ids: any[];
  pickups: PickupsShape;
  tourneys: any[];
};

export type PickupsShape = {
  pickup_id: string;
  mode: string; //literal;
  team_count: number;
  team_size: number;
  min_matches_played: number;
  min_skill: number;
  max_skill: number;
  user_count: number;
  datacenter: string;
  max_ping: number;
  max_party_size: 4;
  users: DBTUser[];
}[];

export type DBTUser = {
  user_id: string;
  name: string;
  mmr: {
    rating: number;
    rank_tier: number;
    rank_position: number | null;
    placement_matches: string;
  };
  party: number;
  avatar: string | null;
  country: string;
};

export type CustomsShape = {
  session_id: number;
  match_type: number;
  name: string;
  password: boolean;
  state: number; //ENUM
  mode: string; //literal
  map: string; //literal
  map_name: string;
  location: string; //literal
  time_limit: number;
  score_limit: number;
  team_count: number;
  team_size: number;
  modifier_instagib: number;
  modifier_physics: number;
  client_count: number;
  max_clients: number;
  match_time: number;
  commands: any[];
  map_list: any[];
  allow_queue: number; //ENUM
  ranked: number; //ENUM
  options: Record<any, any>;
  mmr: number;
  clients: {
    name: string;
    team_id: number;
    user_id: string;
    avatar: string;
    country: string;
  }[];
  team_scores: { 0: number; 1: number };
}[];

export type PlayerCountRecord = {
  timestamp: Date;
  player_count: number;
};

export type PlayerCountReturn = { playerCounts: PlayerCountRecord[] };
