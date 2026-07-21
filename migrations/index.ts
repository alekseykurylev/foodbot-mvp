import * as migration_20260720_081437 from './20260720_081437';
import * as migration_20260721_124737 from './20260721_124737';

export const migrations = [
  {
    up: migration_20260720_081437.up,
    down: migration_20260720_081437.down,
    name: '20260720_081437',
  },
  {
    up: migration_20260721_124737.up,
    down: migration_20260721_124737.down,
    name: '20260721_124737'
  },
];
