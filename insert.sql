INSERT INTO	Roles (
    RName,
	RRaportyAccess,
	RSerwisAccess,
	RUstawieniaAccess,
	RUzytkownicyAccess
    )
VALUES
    ('ADMINISTRATOR',1,0,1,1),
    ('SERWIS',1,1,1,1),
    ('MANAGER',1,0,0,1),
    ('USER',1,0,0,0);

INSERT INTO	WebUsers (
    WULogin,
	WUPassword,
	WUIsActive,
	WURole
    )
VALUES ('admin','admin',1,2);