create table `league` (
  `id` integer auto_increment,
  `name` text not null,
  primary key (`id`)
);

create table `team` (
  `id` integer auto_increment,
  `name` text not null,
  `active` boolean default true,
  `league_id` integer,
  primary key (`id`),
  foreign key (`league_id`) references `league` (`id`)
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
  `team_id` integer,
  `position_id` integer,
  primary key (`id`),
  foreign key (`team_id`) references `team` (`id`),
  foreign key (`position_id`) references `position` (`id`)
);

create table `game` (
  `id` integer auto_increment,
  `date` date,
  `home_team_id` integer not null,
  `away_team_id` integer not null,
  `league_id` integer not null,
  `result` text not null,
  primary key (`id`),
  foreign key (`home_team_id`) references `team` (`id`),
  foreign key (`away_team_id`) references `team` (`id`),
  foreign key (`league_id`) references `league` (`id`)
);

create table `game_player` (
  `player_id` integer not null,
  `game_id` integer not null,
  primary key (`player_id`, `game_id`),
  foreign key (`player_id`) references `player` (`id`),
  foreign key (`game_id`) references `game` (`id`)
);

create table `goal` (
  `id` integer auto_increment,
  `game_id` integer not null,
  `player_id` integer not null,
  `own_goal` boolean default false,
  `minute` integer not null,
  primary key (`id`),
  foreign key (`game_id`) references `game` (`id`),
  foreign key (`player_id`) references `player` (`id`),
  foreign key (`player_id`, `game_id`) references `game_player` (`player_id`, `game_id`)
);

create table `assist` (
  `id` integer auto_increment,
  `game_id` integer not null,
  `goal_id` integer not null,
  `player_id` integer not null,
  primary key (`id`),
  foreign key (`game_id`) references `game` (`id`),
  foreign key (`goal_id`) references `goal` (`id`),
  foreign key (`player_id`) references `player` (`id`),
  foreign key (`player_id`, `game_id`) references `game_player` (`player_id`, `game_id`)
);

update `setting` set `key_value` = '1' where `key_name` = 'db_schema_version';