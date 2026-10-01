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

        return Response.json({
            success: true,

            member: {
                id: auth.memberId,
                name: auth.memberName
            },

            group: {
                id: auth.groupId,
                name: auth.groupName,
                joinCode: auth.joinCode
            }
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