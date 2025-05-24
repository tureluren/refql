create table `rating` (
  `player_id` integer not null unique,
  `acceleration` integer not null,
  `finishing` integer not null,
  `positioning` integer not null,
  `shot_power` integer not null, 
  `free_kick` integer not null,
  `stamina` integer not null,
  `dribbling` integer not null,
  `tackling` integer not null,
  foreign key (`player_id`) references `player` (`id`)
);

update `setting` set `key_value` = '3' where `key_name` = 'db_schema_version';