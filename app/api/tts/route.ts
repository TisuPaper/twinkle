import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';


export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'ElevenLabs API key not configured' },
                { status: 500 }
            );
        }

        const client = new ElevenLabsClient({ apiKey });

        // Generate audio using ElevenLabs
        // Voice ID: AZnzlk1XvdvUeBnXmlld (Domi - American Girl)
        const audio = await client.textToSpeech.convert('AZnzlk1XvdvUeBnXmlld', {
            text,
            modelId: 'eleven_monolingual_v1',
        });

        // Convert the audio stream to a buffer
        const reader = audio.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);

        // Return the audio as a response
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        console.error('TTS Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate audio' },
            { status: 500 }
        );
    }
}
