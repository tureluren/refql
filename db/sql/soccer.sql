create table `setting` (
  `id` serial,
  `key_name` varchar(50) not null,
  `key_value` varchar(50) not null,
  primary key (`id`)
);

insert into `setting` (`key_name`, `key_value`) values ('db_schema_version', '0');