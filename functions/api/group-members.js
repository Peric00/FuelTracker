import { authenticateMember } from "../_shared/auth.js";

export async function onRequestGet(context) {
    try {
        const auth = await authenticateMember(
            context.request,
            context.env.DB
        );

        if (!auth) {
            return Response.json(
                {
                    success: false,
                    error: "Ogiltig eller saknad token."
                },
                { status: 401 }
            );
        }

        const result = await context.env.DB
            .prepare(`
                SELECT
                    Id,
                    Name,
                    CreatedAt
                FROM Members
                WHERE GroupId = ?
                ORDER BY CreatedAt ASC
            `)
            .bind(auth.groupId)
            .all();

        return Response.json({
            success: true,
            members: result.results
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