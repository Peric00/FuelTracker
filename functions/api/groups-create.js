export async function onRequestPost(context) {
    try {
        const body = await context.request.json();

        const groupName = body.groupName?.trim();
        const memberName = body.memberName?.trim();

        if (!groupName || !memberName) {
            return Response.json(
                {
                    success: false,
                    error: "Gruppnamn och namn måste anges."
                },
                { status: 400 }
            );
        }

        const groupId = crypto.randomUUID();
        const memberId = crypto.randomUUID();
        const memberToken = crypto.randomUUID() + crypto.randomUUID();

        const tokenData = new TextEncoder().encode(memberToken);
        const tokenBuffer = await crypto.subtle.digest("SHA-256", tokenData);

        const tokenHash = Array.from(new Uint8Array(tokenBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

       const joinCode = await createUniqueJoinCode(
    context.env.DB
);

        const createdAt = new Date().toISOString();

        await context.env.DB.batch([
            context.env.DB
                .prepare(`
                    INSERT INTO Groups (Id, Name, JoinCode, CreatedAt)
                    VALUES (?, ?, ?, ?)
                `)
                .bind(
                    groupId,
                    groupName,
                    joinCode,
                    createdAt
                ),

            context.env.DB
                .prepare(`
                    INSERT INTO Members
                    (Id, GroupId, Name, CreatedAt, TokenHash)
                    VALUES (?, ?, ?, ?, ?)
                `)
                .bind(
                    memberId,
                    groupId,
                    memberName,
                    createdAt,
                    tokenHash
                )
        ]);

        return Response.json({
            success: true,

            group: {
                id: groupId,
                name: groupName,
                joinCode: joinCode
            },

            member: {
                id: memberId,
                name: memberName
            },

            token: memberToken
        });
    }
    catch (error) {
        return Response.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}


async function createUniqueJoinCode(db) {
    for (let attempt = 0; attempt < 10; attempt++) {

        const number = crypto
            .getRandomValues(new Uint32Array(1))[0] % 1000000;

        const joinCode = number
            .toString()
            .padStart(6, "0");

        const existing = await db
            .prepare(`
                SELECT Id
                FROM Groups
                WHERE JoinCode = ?
                LIMIT 1
            `)
            .bind(joinCode)
            .first();

        if (!existing) {
            return joinCode;
        }
    }

    throw new Error("Kunde inte skapa en unik gruppkod.");
}