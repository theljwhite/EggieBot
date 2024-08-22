import { ResponseLike } from "./types";
import { DBT_WEAP_NAMES } from "./constants";

export const generateUrl = (host: string, path: `/${string}`) => {
  return `${host}${path}`;
};

export const safeParseJson = async <T>(
  input: string | ResponseLike | Request
): Promise<T | Error> => {
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as T;
    } catch (error) {
      console.error(`Error parsing JSON, got '${input}'`);
      return new Error(`Error parsing JSON, got ${input}`);
    }
  }

  const text = await input.text();
  try {
    return JSON.parse(text ?? "null") as T;
  } catch (error) {
    console.error(`Error parsing JSON, got '${text}'`);
    return new Error(`Error parsing JSON, got '${text}'`);
  }
};

export const parseDBTStats = (
  data: Record<string, any>,
  limit?: number
): typeof matches => {
  const matches = data.slice(0, limit ?? 5).map((d, index) => {
    const weapons = d.stats.w.map((weapon, index) => ({
      ...weapon,
      weaponName: DBT_WEAP_NAMES[index] ?? "unknown",
    }));
    return {
      id: index,
      create_ts: d.create_ts,
      finish_ts: d.finish_ts,
      location: d.location,
      external_match_id: d.match_id,
      match_map: d.match_map,
      score_limit: d.score_limit,
      match_time: d.match_time,
      match_mode: d.match_mode,
      match_mm_mode: d.match_mm_mode,
      stats: {
        frags: d.stats.f,
        assists: d.stats.a,
        deaths: d.stats.d,
        damageDone: d.stats.di,
        damageTaken: d.stats.dt,
        selfHealing: d.stats.oh,
        teamHealing: d.stats.th,
        weapons,
      },
      team_stats: d.team_stats,
      team_score: d.team_score,
      team_placement: d.team_placement,
    };
  });
  return matches;
};
