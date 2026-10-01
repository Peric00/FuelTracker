export async function onRequestGet(context) {
    try {
        const result = await context.env.DB
            .prepare("SELECT COUNT(*) AS count FROM Groups")
            .first();

        return Response.json({
            success: true,
            message: "FuelTracker API fungerar!",
            groups: result.count
        });
    } catch (error) {
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}