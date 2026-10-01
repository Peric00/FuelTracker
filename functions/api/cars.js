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
                    RegistrationNumber,
                    FuelType,
                    CreatedAt
                FROM Cars
                WHERE GroupId = ?
                ORDER BY CreatedAt ASC
            `)
            .bind(auth.groupId)
            .all();

        return Response.json({
            success: true,
            cars: result.results
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

        const body = await context.request.json();

        const name = body.name?.trim();
        const registrationNumber =
            body.registrationNumber?.trim() ?? "";
        const fuelType = body.fuelType?.trim() ?? "";

        if (!name) {
            return Response.json(
                {
                    success: false,
                    error: "Bilens namn måste anges."
                },
                { status: 400 }
            );
        }

        const carId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        await context.env.DB
            .prepare(`
                INSERT INTO Cars
                (
                    Id,
                    GroupId,
                    Name,
                    RegistrationNumber,
                    FuelType,
                    CreatedAt
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `)
            .bind(
                carId,
                auth.groupId,
                name,
                registrationNumber,
                fuelType,
                createdAt
            )
            .run();

        return Response.json({
            success: true,

            car: {
                id: carId,
                name: name,
                registrationNumber: registrationNumber,
                fuelType: fuelType,
                createdAt: createdAt
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