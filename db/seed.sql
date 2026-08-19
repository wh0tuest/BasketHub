PRAGMA foreign_keys = ON;
INSERT OR IGNORE INTO users (id,email,password,role) VALUES
(1,'admin@baskethub.local','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','admin'),
(2,'user@baskethub.local','$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','user');
INSERT OR IGNORE INTO tournaments (id,name,location,start_date) VALUES
(1,'Streetball Masters','Berlin','2026-09-10'),
(2,'Gdynia Open','Gdynia','2026-10-05');
INSERT OR IGNORE INTO teams (id,name,city,owner_id) VALUES (1,'Ninja','Tokyo',2);
INSERT OR IGNORE INTO players (id,name,position,age,team_id) VALUES
(1,'Oleksandr','PF',19,1),(2,'Danylo Oliinyk','PG',19,1),(3,'Szymon','SG',19,1),(4,'Marek Kowalski','SF',19,1),(5,'Piotr Nowak','C',19,1);
INSERT OR IGNORE INTO applications (team_id,tournament_id,status) VALUES (1,1,'accepted'),(1,2,'pending');
