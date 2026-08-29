import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const localePath = path.join(process.cwd(), "locales");

export async function GET() {
  try {
    const languages = ["en", "am", "om"];

    const result: Record<string, any> = {};

    for (const lang of languages) {
      const file = await fs.readFile(
        path.join(localePath, `${lang}.json`),
        "utf8"
      );

      result[lang] = JSON.parse(file);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load translations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { lang, data } = await req.json();

    await fs.writeFile(
      path.join(localePath, `${lang}.json`),
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to save file" },
      { status: 500 }
    );
  }
}