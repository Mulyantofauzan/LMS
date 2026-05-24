import { getTrainingMaterialObject } from "@/lib/r2-upload";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key: keyParts } = await context.params;
  const key = keyParts.join("/");
  const object = await getTrainingMaterialObject(key);

  if (!object) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "private, max-age=3600");

  return new Response(object.body, {
    headers,
  });
}
