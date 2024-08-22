import dotenv from "dotenv";
import {
  Client,
  GatewayIntentBits,
  Events,
  REST as DiscordRestClient,
  Routes,
  ChatInputCommandInteraction,
  ActivityType,
} from "discord.js";
import { InteractionHandler } from "./command-handler";
import { EggieApi } from "./external/api";
import { Either } from "./types";
import { ServersListData } from "./external/types";
import { SerializedError } from "./error";

dotenv.config();

class EggieBot {
  private client: Client;
  private interactionHandler: InteractionHandler;
  private discordRestClient: DiscordRestClient;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      shards: "auto",
      failIfNotExists: false,
    });

    this.discordRestClient = new DiscordRestClient().setToken(
      process.env.DISCORD_ACCESS_TOKEN ?? ""
    );
    this.interactionHandler = new InteractionHandler();
  }

  public async startBot(): Promise<void> {
    try {
      await this.client.login(process.env.DISCORD_ACCESS_TOKEN ?? "");
      await this.addClientEventHandlers();
      await this.registerSlashCommands();
    } catch (error) {
      console.error("Error starting bot", error);
    }
  }

  public async addClientEventHandlers(): Promise<void> {
    const REFETCH_PICKUPS_MS = 60_000;

    this.client.on(Events.ClientReady, async () => {
      console.log("Bot client logged in");

      await this.pollBestPickupStatus();

      // setInterval(async () => {
      //   await this.pollBestPickupStatus();
      // }, REFETCH_PICKUPS_MS);
    });

    this.client.on(Events.Error, (error) => {
      console.error("Client error", error);
    });

    this.client.on(Events.InteractionCreate, (interaction) => {
      this.interactionHandler.handleInteraction(
        interaction as ChatInputCommandInteraction
      );
    });
  }

  public async registerSlashCommands(): Promise<void> {
    try {
      const commands = this.interactionHandler.getSlashCommands();
      const data: any = await this.discordRestClient.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID ?? ""),
        {
          body: commands,
        }
      );
      console.log(`Registered ${data.length} global (/) commands`);
    } catch (error) {
      console.error("Error registering application (/) commands", error);
    }
  }

  public async pollBestPickupStatus(): Promise<void> {
    const api = new EggieApi({ host: "https://diabotical.cool" });

    try {
      const response = await api.eggieGet<
        Either<{ data: ServersListData }, SerializedError>
      >("/api/v1/servers/", "Failed to fetch server list.");

      const pickups = response.data.data.pickups
        .filter(
          (pickup) => pickup.user_count < pickup.team_size * pickup.team_count
        )
        .sort((a, b) => b.user_count - a.user_count);

      const bestPlayerCount = `${pickups[0].user_count}/${
        pickups[0].team_size * pickups[0].team_size
      }`;

      this.client.user.setActivity(
        pickups.length > 0
          ? `Pickup available: ${bestPlayerCount} at ${pickups[0].datacenter}`
          : "No pickups awaiting players",
        {
          type: ActivityType.Custom,
        }
      );
    } catch (error) {
      this.client.user.setActivity("Currently unable to fetch pickups", {
        type: ActivityType.Custom,
      });
    }
  }
}

const app = new EggieBot();

app.startBot();
