import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
}

interface YouTubeApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: {
      medium: { url: string };
    };
  };
}

interface YouTubeApiResponse {
  items: YouTubeApiItem[];
  error?: { message: string };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json({ error: 'YouTube API key is not configured.' }, { status: 500 });
  }

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is missing.' }, { status: 400 });
  }

  const url = `${YOUTUBE_API_URL}?part=snippet&q=${encodeURIComponent(`travel highlights ${query}`)}&key=${YOUTUBE_API_KEY}&type=video&maxResults=3`;

  try {
    const res = await fetch(url);
    const data: YouTubeApiResponse = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to fetch videos from YouTube.');
    }

    const videos: YouTubeVideo[] = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
    }));

    return NextResponse.json(videos);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('YouTube API Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
