import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/nickname?nickname=<nickname>
 * Fetch nickname data for client-side refresh
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const nickname = searchParams.get("nickname");

		if (!nickname) {
			return NextResponse.json(
				{ error: "Nickname is required" },
				{ status: 400 }
			);
		}

		const supabase = await createClient();

		const { data, error } = await supabase
			.from("nicknames")
			.select("*")
			.eq("nickname", nickname)
			.maybeSingle();

		if (error) {
			console.error("Error fetching nickname:", error);
			return NextResponse.json(
				{ error: "Failed to fetch nickname" },
				{ status: 500 }
			);
		}

		if (!data) {
			return NextResponse.json(
				{ error: "Nickname not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ data });
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}