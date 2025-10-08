"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface VideoHighlightsProps {
  location: string;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
}

export default function VideoHighlights({ location }: VideoHighlightsProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/youtube?query=${encodeURIComponent(location)}`);
        if (!res.ok) {
          throw new Error('Could not load videos.');
        }
        const data: Video[] = await res.json();
        setVideos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, [location]);

  if (loading) {
    return <div className="p-2 text-center text-sm text-gray-400">Loading videos...</div>;
  }

  if (error) {
    return <div className="p-2 text-center text-sm text-red-400">{error}</div>;
  }
  
  if (videos.length === 0) {
      return <div className="p-2 text-center text-sm text-gray-500">No videos found.</div>;
  }

  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {videos.map((video) => (
        <a 
          key={video.id} 
          href={`https://www.youtube.com/watch?v=${video.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-gray-900/50 rounded-lg overflow-hidden group"
        >
          <div className="relative">
            <Image 
              src={video.thumbnailUrl} 
              alt={video.title} 
              width={320} 
              height={180} 
              className="w-full object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
          </div>
          <p 
            className="text-xs p-2 text-gray-300 group-hover:text-white" 
            title={video.title}
          >
            {video.title.length > 50 ? `${video.title.substring(0, 50)}...` : video.title}
          </p>
        </a>
      ))}
    </div>
  );
}