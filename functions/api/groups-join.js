export async function onRequestPost(context) {
    try {
        const body = await context.request.json();

        const joinCode = body.joinCode?.trim();
        const memberName = body.memberName?.trim();

        if (!joinCode || !memberName) {
            return Response.json(
                {
                    success: false,
                    error: "Gruppkod och namn måste anges."
                },
                { status: 400 }
            );
        }

        if (!/^\d{6}$/.test(joinCode)) {
            return Response.json(
                {
                    success: false,
                    error: "Gruppkoden måste bestå av 6 siffror."
                },
                { status: 400 }
            );
        }

        const group = await context.env.DB
            .prepare(`
                SELECT Id, Name, JoinCode
                FROM Groups
                WHERE JoinCode = ?
                LIMIT 1
            `)
            .bind(joinCode)
            .first();

        if (!group) {
            return Response.json(
                {
                    success: false,
                    error: "Ingen grupp hittades med den koden."
                },
                { status: 404 }
            );
        }

        const memberId = crypto.randomUUID();
        const memberToken =
            crypto.randomUUID() + crypto.randomUUID();

        const tokenData = new TextEncoder().encode(memberToken);

        const tokenBuffer = await crypto.subtle.digest(
            "SHA-256",
            tokenData
        );

        const tokenHash = Array
            .from(new Uint8Array(tokenBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");

        const createdAt = new Date().toISOString();

        await context.env.DB
            .prepare(`
                INSERT INTO Members
                (Id, GroupId, Name, CreatedAt, TokenHash)
                VALUES (?, ?, ?, ?, ?)
            `)
            .bind(
                memberId,
                group.Id,
                memberName,
                createdAt,
                tokenHash
            )
            .run();

        return Response.json({
            success: true,

            group: {
                id: group.Id,
                name: group.Name,
                joinCode: group.JoinCode
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