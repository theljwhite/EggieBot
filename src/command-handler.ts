import { ChatInputCommandInteraction } from "discord.js";
import { type Command } from "./command";
import {
  PingCommand,
  PendingPickupsCommand,
  ActiveMatchesCountCommand,
  PlayerMatchHistoryCommand,
  TotalPlayersCommand,
  TotalPlayersLastDay,
  ListCommandsCommand,
  ServerListCommand,
} from "./command";

export class InteractionHandler {
  private commands: Command[];

  constructor() {
    this.commands = [
      new PingCommand(),
      new ListCommandsCommand(),
      new ServerListCommand(),
      new PendingPickupsCommand(),
      new ActiveMatchesCountCommand(),
      new PlayerMatchHistoryCommand(),
      new TotalPlayersCommand(),
      new TotalPlayersLastDay(),
    ];
  }

  public getSlashCommands() {
    return this.commands.map((command: Command) =>
      command.slashCommandConfig.toJSON()
    );
  }

  public async handleInteraction(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    try {
      const commandName = interaction.commandName;

      const matchedCommand = this.commands.find(
        (command) => command.name === commandName
      );

      if (!matchedCommand) return Promise.reject("Command not found.");

      await matchedCommand.execute(interaction);

      console.log(
        `Successfully executed command [/${interaction.commandName}]`,
        { guild: { id: interaction.guildId }, name: interaction.guild.name },
        { user: { name: interaction.user.globalName } }
      );
    } catch (error) {
      console.log(
        `Error executing command [/${interaction.commandName}]: ${error}`
      );
    }
  }
}
