create table `rating` (
  `player_id` integer unique references `player` (`id`) not null,
  `acceleration` integer not null,
  `finishing` integer not null,
  `positioning` integer not null,
  `shot_power` integer not null, 
  `free_kick`integer not null,
  `stamina` integer not null,
  `dribbling` integer not null,
  `tackling` integer not null
);

update `general`.`setting` set `key_value` = '3' where `key_name` = 'db_schema_version';