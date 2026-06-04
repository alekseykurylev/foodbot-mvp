import * as migration_20260602_074537_init from './20260602_074537_init';
import * as migration_20260603_162838 from './20260603_162838';
import * as migration_20260603_191406 from './20260603_191406';
import * as migration_20260604_172940 from './20260604_172940';

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
  {
    up: migration_20260603_191406.up,
    down: migration_20260603_191406.down,
    name: '20260603_191406',
  },
  {
    up: migration_20260604_172940.up,
    down: migration_20260604_172940.down,
    name: '20260604_172940'
  },
];
