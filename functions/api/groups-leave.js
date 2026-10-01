import { authenticateMember } from "../_shared/auth.js";

export async function onRequestPost(context) {
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

        await context.env.DB
            .prepare(`
                DELETE FROM Members
                WHERE Id = ?
            `)
            .bind(auth.memberId)
            .run();

        return Response.json({
            success: true
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