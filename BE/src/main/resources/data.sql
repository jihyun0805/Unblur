-- Local seed data
INSERT INTO users (id, email, encrypted_password, auth_provider, nickname, birth_date, gender,
                   clarity_score, is_active, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'user1@test.com',
        '$2a$10$i7TZ8BfJ0fWT8vJf3QQFTOCu.mUBXet4spW/iHBcAv1ZJj3dIZ61G', 'LOCAL', 'user1', '1998-01-01', 'MALE',
        60, true, now(), now()),
       ('22222222-2222-2222-2222-222222222222', 'user2@test.com',
        '$2a$10$i7TZ8BfJ0fWT8vJf3QQFTOCu.mUBXet4spW/iHBcAv1ZJj3dIZ61G', 'LOCAL', 'user2', '1999-02-02', 'FEMALE',
        40, true, now(), now());

INSERT INTO conferences (id, status, current_round, started_at, ended_at, created_at)
VALUES ('33333333-3333-3333-3333-333333333333', 'COMPLETED', 4,
        now() - interval '30 minutes', now(), now() - interval '35 minutes');

INSERT INTO conference_participants (id, conference_id, user_id, joined_at, left_at)
VALUES ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111', now() - interval '35 minutes', now()),
       ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333',
        '22222222-2222-2222-2222-222222222222', now() - interval '34 minutes', now());
