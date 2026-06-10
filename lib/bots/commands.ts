export const BOT_COMMANDS = [
  {
    command: "start",
    description: "Начать работу с ботом",
  },
  {
    command: "menu",
    description: "Открыть меню",
  },
  {
    command: "phone",
    description: "Поделиться телефоном",
  },
] as const;

export const MAX_BOT_COMMANDS = BOT_COMMANDS.map(({ command, description }) => ({
  name: command,
  description,
}));
