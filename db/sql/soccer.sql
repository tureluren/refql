create schema if not exists `general`;

create table `general`.`setting` (
  `id` integer auto_increment,
  `key_name` varchar(50) not null,
  `key_value` varchar(50) not null,
  primary key (`id`)
);

insert into `general`.`setting` (`key_name`, `key_value`) values ('db_schema_version', '0');