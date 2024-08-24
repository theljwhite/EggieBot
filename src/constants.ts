//TODO - correct datacenter abbrevs, correct mode names

export enum DBT_WEAP_NAMES {
  MELEE = 0,
  MG = 1,
  PLASMA = 2,
  SG = 3,
  ROCKET = 4,
  LG = 5,
  RAIL = 7,
  GRENADE = 8,
  VOID = 19,
  GRAV_BALL = 13,
  SLOW_BALL = 14,
  KNOCK_BALL = 15,
  SMOKE_BALL = 16,
}

export const ONE_DAY_SECONDS = 86_400;
export const SPACE_BETWEEN_CAPITALS_REGEX = /([a-z])([A-Z])/g;

export const DATACENTERS = {
  chi: "Chicago",
  dal: "Dallas",
  rot: "Rotterdam",
  sea: "Seattle",
  lon: "London",
  mia: "Miami",
  ash: "Ashburn",
  los: "Los Angeles",
  war: "Warsaw",
  san: "Santa Clara",
};

export const GAME_MODES = {
  md_wipeout: "Wipeout",
  md_duel: "Duel",
};
