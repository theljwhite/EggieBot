import {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  ChatInputCommandInteraction,
  CacheType,
  InteractionResponse,
} from "discord.js";
import { EggieApi } from "./api";
import { Either } from "./types";
import { SerializedError } from "./error";
import { InteractionHandler } from "./command-handler";
import { PlayerCountReturn, ServersListData } from "./types/return-types";
import {
  camelToFlat,
  getDBTCoolDateShapeFromDate,
  parseDBTStats,
} from "./utils";

export interface Command {
  name: string;
  description?: string;
  slashCommandConfig: SlashCommandOptionsOnlyBuilder;

  execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<InteractionResponse>;
}

export class PingCommand implements Command {
  name = "ping";
  description = "Pings the EggieBot";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<InteractionResponse> {
    return interaction.reply(
      "Pong. That and 50 cents would get you a cup of coffee. ☕"
    );
  }
}

export class ListCommandsCommand implements Command {
  name = "list_commands";
  description = "Print a list of all Eggie commands to the chat.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<InteractionResponse> {
    const interactionHandler = new InteractionHandler();
    const commands = interactionHandler.getSlashCommands().map((command) => ({
      name: `/${command.name}`,
      value: command.description,
    }));

    const embeds = [
      {
        color: 0xff9900,
        title: "EggieBot Commands List",
        description: "A list of all usuable commands.",
        fields: commands,
      },
    ];

    return interaction.reply({ embeds });
  }
}

export class TotalPlayersCommand implements Command {
  name = "player_count";
  description = "Gets the total number of DBT players right now.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<InteractionResponse> {
    const api = new EggieApi({ host: "https://diabotical.cool" });

    const response = await api.eggieGet<
      Either<{ data: ServersListData }, SerializedError>
    >("/api/v1/servers/", "Failed to fetch server list.");

    const pickupUsers = response.data.data.pickups.map((p) => p.user_count);
    const customsUsers = response.data.data.customs.map((c) => c.client_count);

    const countsPerServer = [...pickupUsers, ...customsUsers];

    const totalUsers = countsPerServer.reduce((prev, curr) => prev + curr, 0);

    return interaction.reply(
      `There are currently (${totalUsers}) active users between customs and pickups. 🌎`
    );
  }
}

export class TotalPlayersLastDay implements Command {
  name = "player_count_last_day";
  description = "Get the total number of players in the last day.";
  slashCommandConfig = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<InteractionResponse> {
    const api = new EggieApi({ host: "https://diabotical.cool" });

    const now = new Date();
    const nowMinusOneDay = new Date(now.setDate(now.getDate() - 1));

    const dateString = getDBTCoolDateShapeFromDate(nowMinusOneDay);

    const response = await api.eggieGet<PlayerCountReturn>(
      `/api/v1/live-player-count?start_date=${dateString}&range=last24h`,
      "Failed to fetch player counts"
    );

    const totalPlayerCountDay = response.playerCounts.reduce(
      (prev, curr) => prev + curr.player_count,
      0
    );

    if (totalPlayerCountDay === 0) {
      return interaction.reply(
        `Couldn't find any player data for the last 24 hrs. It is possible that this is an external API issue. 😐`
      );
    }

    return interaction.reply(
      `There were (${totalPlayerCountDay}) players in the last 24 hrs. 🤩`
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
  ): Promise<InteractionResponse> {
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

  public async execute(
    interaction: ChatInputCommandInteraction<CacheType>
  ): Promise<InteractionResponse> {
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
      skill: `MIN: ${Math.round(p.min_skill)}, MAX: ${Math.round(p.max_skill)}`,
    }));

    const customs = response.data.data.customs.map((c, index) => ({
      index: index + 1,
      name: c.name ?? "Custom Lobby",
      type: "Custom",
      map: c.map_name ?? "Unknown",
      mode: c.mode,
      playerCount: c.client_count,
      location: c.location,
      scoreLimit: c.score_limit ?? "None",
    }));

    const embeds = [...pickups, ...customs].map((item, index) => ({
      color: item.type === "Pickup" ? 0xff9900 : 0x0099ff,
      title: `${item.type} (Server #${index + 1})`,
      description: `Details about this ${item.type} match`,
      fields: Object.entries(item).map(([key, value]) => ({
        name: camelToFlat(key),
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
  ): Promise<InteractionResponse> {
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
      fields: [
        {
          name: "Players List",
          value: pickup.users.map((user) => user.name).join(", "),
        },
      ],
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
  ): Promise<InteractionResponse> {
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
