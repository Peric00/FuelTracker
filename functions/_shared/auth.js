export async function authenticateMember(request, db) {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
        return null;
    }

    const tokenData = new TextEncoder().encode(token);

    const tokenBuffer = await crypto.subtle.digest(
        "SHA-256",
        tokenData
    );

    const tokenHash = Array
        .from(new Uint8Array(tokenBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");

    const member = await db
        .prepare(`
            SELECT
                Members.Id AS MemberId,
                Members.Name AS MemberName,
                Members.GroupId AS GroupId,
                Groups.Name AS GroupName,
                Groups.JoinCode AS JoinCode
            FROM Members
            INNER JOIN Groups
                ON Groups.Id = Members.GroupId
            WHERE Members.TokenHash = ?
            LIMIT 1
        `)
        .bind(tokenHash)
        .first();

    if (!member) {
        return null;
    }

    return {
        memberId: member.MemberId,
        memberName: member.MemberName,
        groupId: member.GroupId,
        groupName: member.GroupName,
        joinCode: member.JoinCode
    };
}