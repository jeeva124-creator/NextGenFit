import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Text-to-speech is handled by the browser's Web Speech API
    // This endpoint exists for compatibility but is not needed
    return NextResponse.json(
      {
        message: "Text-to-speech is handled by the browser's Web Speech API. No server-side TTS is needed.",
        note: "The VoicePlayer component uses the browser's native speech synthesis."
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in TTS route:", error);
    return NextResponse.json(
      { error: "Text-to-speech is handled client-side using Web Speech API." },
      { status: 200 }
    );
  }
}
