import * as migration_20260602_074537_init from './20260602_074537_init';
import * as migration_20260603_162838 from './20260603_162838';

export const migrations = [
  {
    up: migration_20260602_074537_init.up,
    down: migration_20260602_074537_init.down,
    name: '20260602_074537_init',
  },
  {
    up: migration_20260603_162838.up,
    down: migration_20260603_162838.down,
    name: '20260603_162838',
  },
];
