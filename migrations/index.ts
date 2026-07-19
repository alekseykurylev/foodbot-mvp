import * as migration_20260719_140719 from './20260719_140719';

export const migrations = [
  {
    up: migration_20260719_140719.up,
    down: migration_20260719_140719.down,
    name: '20260719_140719'
  },
];
