create table `league` (
  `id` integer auto_increment,
  `name` text,
  primary key (`id`)
);

create table `team` (
  `id` integer auto_increment,
  `name` text,
  `league_id` integer references `league` (`id`),
  primary key (`id`)
);

create table `position` (
  `id` integer auto_increment,
  `name` text,
  primary key (`id`)
);

create table `player` (
  `id` integer auto_increment,
  `first_name` text,
  `last_name` text,
  `birthday` date,
  `team_id` integer references `team` (`id`),
  `position_id` integer references `position` (`id`),
  primary key (`id`)
);

create table `game` (
  `id` integer auto_increment,
  `home_team_id` integer references `team` (`id`),
  `away_team_id` integer references `team` (`id`),
  `league_id` integer references `league` (`id`),
  `result` text,
  primary key (`id`)
);

create table `` (
  `player_id` integer references `player` (`id`),
  `game_id` integer references `game` (`id`),
  primary key (`player_id`, `game_id`)
);

create table `goal` (
  `id` integer auto_increment,
  `game_id` integer references `game` (`id`),
  `player_id` integer references `player` (`id`),
  `own_goal` boolean default false,
  `minute` integer,
  primary key (`id`),
  constraint `goal_player_game_fkey` foreign key (`player_id`, `game_id`) references `player_game` (`player_id`, `game_id`)
);

create table `assist` (
  `id` integer auto_increment,
  `game_id` integer references `game` (`id`),
  `goal_id` integer references `goal` (`id`),
  `player_id` integer references `player` (`id`),
  primary key (`id`),
  constraint `assist_player_game_fkey` foreign key (`player_id`, `game_id`) references `player_game` (`player_id`, `game_id`)
);

update `setting` set `key_value` = '1' where `key_name` = 'db_schema_version';