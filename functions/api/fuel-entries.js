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
                    FuelEntries.Id,
                    FuelEntries.GroupId,
                    FuelEntries.CarId,
                    FuelEntries.MemberId,
                    FuelEntries.Liters,
                    FuelEntries.TotalCost,
                    FuelEntries.Date,
                    FuelEntries.CreatedAt,
                    COALESCE(FuelEntries.CarName, Cars.Name) AS CarName,
                    Members.Name AS MemberName
                FROM FuelEntries
                LEFT JOIN Cars
    ON Cars.Id = FuelEntries.CarId
                INNER JOIN Members
                    ON Members.Id = FuelEntries.MemberId
                WHERE FuelEntries.GroupId = ?
                ORDER BY FuelEntries.Date DESC,
                         FuelEntries.CreatedAt DESC
            `)
            .bind(auth.groupId)
            .all();

        return Response.json({
            success: true,
            fuelEntries: result.results
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

        const carId =
            body.carId?.toString().trim();

        const liters =
            Number(body.liters);

        const totalCost =
            Number(body.totalCost);

        const date =
            body.date?.toString().trim();

        if (!carId) {
            return Response.json(
                {
                    success: false,
                    error: "Bil måste anges."
                },
                { status: 400 }
            );
        }

        if (!Number.isFinite(liters) || liters <= 0) {
            return Response.json(
                {
                    success: false,
                    error: "Antal liter måste vara större än 0."
                },
                { status: 400 }
            );
        }

        if (!Number.isFinite(totalCost) || totalCost <= 0) {
            return Response.json(
                {
                    success: false,
                    error: "Kostnaden måste vara större än 0."
                },
                { status: 400 }
            );
        }

        if (!date) {
            return Response.json(
                {
                    success: false,
                    error: "Datum måste anges."
                },
                { status: 400 }
            );
        }

        const car = await context.env.DB
            .prepare(`
                SELECT
                    Id,
                    Name
                FROM Cars
                WHERE Id = ?
                  AND GroupId = ?
                LIMIT 1
            `)
            .bind(
                carId,
                auth.groupId
            )
            .first();

        if (!car) {
            return Response.json(
                {
                    success: false,
                    error: "Den valda bilen kunde inte hittas i gruppen."
                },
                { status: 404 }
            );
        }

        const fuelEntryId =
            crypto.randomUUID();

        const createdAt =
            new Date().toISOString();

        await context.env.DB
            .prepare(`
                INSERT INTO FuelEntries
(
    Id,
    GroupId,
    CarId,
    CarName,
    MemberId,
    Liters,
    TotalCost,
    Date,
    CreatedAt
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                fuelEntryId,
                auth.groupId,
                car.Id,
car.Name,
                auth.memberId,
                liters,
                totalCost,
                date,
                createdAt
            )
            .run();

        return Response.json({
            success: true,

            fuelEntry: {
                id: fuelEntryId,
                groupId: auth.groupId,
                carId: car.Id,
                carName: car.Name,
                memberId: auth.memberId,
                memberName: auth.memberName,
                liters: liters,
                totalCost: totalCost,
                date: date,
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


export async function onRequestDelete(context) {
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

        const url =
            new URL(context.request.url);

        const fuelEntryId =
            url.searchParams.get("id");

        if (!fuelEntryId) {
            return Response.json(
                {
                    success: false,
                    error: "Tankningens id saknas."
                },
                { status: 400 }
            );
        }

        const entry =
            await context.env.DB
                .prepare(`
                    SELECT Id
                    FROM FuelEntries
                    WHERE Id = ?
                      AND GroupId = ?
                    LIMIT 1
                `)
                .bind(
                    fuelEntryId,
                    auth.groupId
                )
                .first();

        if (!entry) {
            return Response.json(
                {
                    success: false,
                    error: "Tankningen kunde inte hittas."
                },
                { status: 404 }
            );
        }

        await context.env.DB
            .prepare(`
                DELETE FROM FuelEntries
                WHERE Id = ?
                  AND GroupId = ?
            `)
            .bind(
                fuelEntryId,
                auth.groupId
            )
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