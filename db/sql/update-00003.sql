create table `rating` (
  `player_id` integer unique references `player` (`id`),
  `acceleration` integer,
  `finishing` integer,
  `positioning` integer,
  `shot_power` integer, 
  `free_kick`integer,
  `stamina` integer,
  `dribbling` integer,
  `tackling` integer
);

update `setting` set `key_value` = '3' where `key_name` = 'db_schema_version';