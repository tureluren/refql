create table `league` (
  `id` integer auto_increment,
  `name` text not null,
  primary key (`id`)
);

create table `team` (
  `id` integer auto_increment,
  `name` text not null,
  `active` boolean default true,
  `league_id` integer references `league` (`id`),
  primary key (`id`)
);

create table `position` (
  `id` integer auto_increment,
  `name` text not null,
  primary key (`id`)
);

create table `player` (
  `id` integer auto_increment,
  `first_name` text not null,
  `last_name` text not null,
  `cars` json,
  `birthday` date,
  `team_id` integer references `team` (`id`),
  `position_id` integer references `position` (`id`),
  primary key (`id`)
);

create table `game` (
  `id` integer auto_increment,
  `date` date,
  `home_team_id` integer references `team` (`id`) not null,
  `away_team_id` integer references `team` (`id`) not null,
  `league_id` integer references `league` (`id`) not null,
  `result` text not null,
  primary key (`id`)
);

create table `game_player` (
  `player_id` integer references `player` (`id`) not null,
  `game_id` integer references `game` (`id`) not null,
  primary key (`player_id`, `game_id`)
);

create table `goal` (
  `id` integer auto_increment,
  `game_id` integer references `game` (`id`) not null,
  `player_id` integer references `player` (`id`) not null,
  `own_goal` boolean default false,
  `minute` integer not null,
  primary key (`id`),
  constraint `goal_game_player_fkey` foreign key (`player_id`, `game_id`) references `game_player` (`player_id`, `game_id`)
);

create table `assist` (
  `id` integer auto_increment,
  `game_id` integer references `game` (`id`) not null,
  `goal_id` integer references `goal` (`id`) not null,
  `player_id` integer references `player` (`id`) not null,
  primary key (`id`),
  constraint `assist_game_player_fkey` foreign key (`player_id`, `game_id`) references `game_player` (`player_id`, `game_id`)
);

update `general`.`setting` set `key_value` = '1' where `key_name` = 'db_schema_version';