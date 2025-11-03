import { NextRequest, NextResponse } from "next/server";
import { getReplicate } from "@/lib/replicate";

type Body = {
    prompt: string;
    type?: "exercise" | "meal";
};

const buildPrompt = (title: string, type: "exercise" | "meal" = "exercise") => {
    if (type === "meal") {
        return `High-quality food photography of ${title}. professional food styling, natural lighting, appetizing plating, shallow depth of field, realistic textures, DSLR photo.`;
    }
    // exercise
    return `Realistic photo of a person performing ${title} in a gym setting, proper form, full body, neutral background, detailed muscles, natural lighting, sharp focus, DSLR photograph.`;
};

export async function POST(req: NextRequest) {
    try {
        const body: Body = await req.json();
        const title = (body?.prompt || "").toString().slice(0, 120);
        const type = body?.type === "meal" ? "meal" : "exercise";

        if (!title) {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
        }

        const replicate = getReplicate();
        if (!replicate) {
            return NextResponse.json(
                { error: "Image generation disabled: missing REPLICATE_API_TOKEN" },
                { status: 503 }
            );
        }

        const prompt = buildPrompt(title, type);

        let imageUrl: string | null = null;

        try {
            const output = (await replicate.run(
                "black-forest-labs/flux-1.1-pro",
                {
                    input: {
                        prompt,
                        guidance: 3.5,
                        steps: 28,
                        aspect_ratio: type === "meal" ? "1:1" : "4:5",
                    },
                }
            )) as any;

            if (Array.isArray(output) && output.length > 0) {
                imageUrl = output[0];
            } else if (typeof output === "string") {
                imageUrl = output;
            }
        } catch {
            const output = (await replicate.run(
                "stability-ai/sdxl",
                {
                    input: {
                        prompt,
                        guidance_scale: 7,
                        num_inference_steps: 35,
                        aspect_ratio: type === "meal" ? "1:1" : "4:5",
                    },
                }
            )) as any;
            if (Array.isArray(output) && output.length > 0) {
                imageUrl = output[0];
            } else if (typeof output === "string") {
                imageUrl = output;
            }
        }

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Failed to generate image" },
                { status: 500 }
            );
        }

        return NextResponse.json({ url: imageUrl, prompt, type });
    } catch (error) {
        console.error("/api/generate-image error", error);
        return NextResponse.json(
            { error: "Unexpected server error" },
            { status: 500 }
        );
    }
}
