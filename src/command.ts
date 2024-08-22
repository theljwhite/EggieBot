import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CacheType,
} from "discord.js";
import { EggieApi } from "./external/api";
import { Either } from "./types";
import { SerializedError } from "./error";
import { ServersListData } from "./external/types";
import { parseDBTStats } from "./utils";

export interface Command {
  name: string;
  description?: string;
  slashCommandConfig: any;

  execute(interaction: ChatInputCommandInteraction): Promise<any>;
}

export class PingCommand implements Command {
  name = "ping";
  description = "Pings the EggieBot";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<any> {
    return interaction.reply(
      "Pong. That and 50 cents would get you a cup of coffee."
    );
  }
}

export class TotalPlayersCommand implements Command {
  name = "player_count";
  description = "Gets the total number of DBT players.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(interaction: ChatInputCommandInteraction): Promise<any> {
    const api = new EggieApi({ host: "https://diabotical.cool" });

    const response = await api.eggieGet<
      Either<{ data: ServersListData }, SerializedError>
    >("/api/v1/servers/", "Failed to fetch server list.");

    const pickupUsers = response.data.data.pickups.map((p) => p.user_count);
    const customsUsers = response.data.data.customs.map((c) => c.client_count);

    const countsPerServer = [...pickupUsers, ...customsUsers];

    const totalUsers = countsPerServer.reduce((prev, curr) => prev + curr, 0);

    return interaction.reply(
      `There are currently (${totalUsers}) active users between customs and pickups.`
    );
  }
}

export class ActiveMatchesCountCommand implements Command {
  name = "count_matches";
  description = "Get the number of active pickups, customs, etc.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<any> {
    const api = new EggieApi({ host: "https://diabotical.cool" });

    const response = await api.eggieGet<
      Either<{ data: ServersListData }, SerializedError>
    >("/api/v1/servers/", "Failed to fetch server list.");

    const embed = {
      color: 0x0099ff,
      title: "Number of active matches",
      fields: [
        { name: "Customs", value: String(response.data.data.customs.length) },
        { name: "Pickups", value: String(response.data.data.pickups.length) },
      ],
    };
    return interaction.reply({ embeds: [embed] });
  }
}

export class ServerListCommand implements Command {
  name = "list_servers";
  description = "List all Diabotical servers.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(interaction: ChatInputCommandInteraction): Promise<any> {
    const api = new EggieApi({ host: "https://diabotical.cool" });

    const response = await api.eggieGet<
      Either<{ data: ServersListData }, SerializedError>
    >("/api/v1/servers/", "Failed to fetch server list.");

    const pickups = response.data.data.pickups.map((p) => ({
      id: p.pickup_id,
      type: "Pickup",
      mode: p.mode,
      location: p.datacenter,
      playerCount: p.user_count,
      lobbySize: p.team_size * p.team_count,
      minMatches: p.min_matches_played,
      skill: `MIN: ${p.min_skill}, MAX: ${p.max_skill}`,
    }));

    const customs = response.data.data.customs.map((c) => ({
      name: c.name,
      type: "Custom",
      map: c.map_name,
      playerCount: c.client_count,
      location: c.location,
      scoreLimit: c.score_limit,
    }));

    const embeds = [...pickups, ...customs].map((item, index) => ({
      color: item.type === "Pickup" ? 0xff9900 : 0x0099ff,
      title: `${item.type} - ${index}`,
      description: `Details about this ${item.type} match`,
      fields: Object.entries(item).map(([key, value]) => ({
        name: key,
        value: String(value),
        inline: true,
      })),
    }));

    return interaction.reply({ embeds });
  }
}

export class PendingPickupsCommand implements Command {
  name = "pending_pickups";
  description = "Get pickups awaiting more players.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<any> {
    const api = new EggieApi({ host: "https://diabotical.cool" });

    const response = await api.eggieGet<
      Either<{ data: ServersListData }, SerializedError>
    >("/api/v1/servers/", "Failed to fetch server list.");

    const pickups = response.data.data.pickups.filter(
      (pickup) => pickup.user_count < pickup.team_size * pickup.team_count
    );

    const embeds = pickups.map((pickup) => ({
      color: 0x0099ff,
      title: `${pickup.mode} on ${pickup.datacenter}`,
      description: `Players: ${pickup.user_count}/${
        pickup.team_size * pickup.team_count
      }`,
      fields: pickup.users.map((user) => ({
        name: "Player",
        value: user.name,
        inline: true,
      })),
    }));

    return interaction.reply({ embeds });
  }
}

export class PlayerMatchHistoryCommand implements Command {
  name = "player_history";
  description = "Get recent match history for a player.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option.setName("epicid").setDescription("Your Epic Games id")
    );

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<any> {
    const epicId = interaction.options.getString("epicid");

    if (epicId.length < 32) {
      return interaction.reply("Invalid Epic Games id.");
    }

    const api = new EggieApi({ host: "https://api.diabotical.com/api" });
    const response = await api.eggieGet(
      `/v0/diabotical/users/${epicId}/matches`,
      "Failed to fetch match history"
    );

    const data = response.matches as Record<string, any>[]; //TODO fix type

    const matches = parseDBTStats(data);

    const embeds = matches.map((m) => {
      const fields = [
        {
          name: "Frags / Assists / Deaths",
          value: `${m.stats.frags}/${m.stats.assists}/${m.stats.deaths}`,
        },
        {
          name: "DMG Done / DMG Taken",
          value: `${m.stats.damageDone}/${m.stats.damageTaken}`,
        },
        {
          name: "Own Heal / Team Heal",
          value: `${m.stats.selfHealing}/${m.stats.teamHealing}`,
        },
      ];

      const weaponFields = m.stats.weapons.map((w) => ({
        name: w.weaponName,
        value: `Damage done: ${w.di} - Damage taken: ${w.dt}`,
        inline: true,
      }));

      return {
        color: 0x0099ff,
        title: `Match on ${new Date(m.finish_ts)}`,
        description: `${m.match_mode.toUpperCase()} on ${
          m.match_map
        } - ${m.location.toUpperCase()}`,
        fields: [...fields, ...weaponFields],
      };
    });

    return interaction.reply({ embeds });
  }
}
