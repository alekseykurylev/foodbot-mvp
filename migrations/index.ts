import * as migration_20260602_074537_init from './20260602_074537_init';

export const migrations = [
  {
    up: migration_20260602_074537_init.up,
    down: migration_20260602_074537_init.down,
    name: '20260602_074537_init'
  },
];
