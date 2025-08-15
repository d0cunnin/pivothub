import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VideoUrlCache {
  url: string;
  expiresAt: string;
}

const videoUrlCache = new Map<string, VideoUrlCache>();

export const useVideoUrl = (videoPath?: string) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (!videoPath || !session) {
      setVideoUrl(null);
      return;
    }

    const fetchVideoUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const cached = videoUrlCache.get(videoPath);
        if (cached && new Date(cached.expiresAt) > new Date()) {
          setVideoUrl(cached.url);
          setLoading(false);
          return;
        }

        // Fetch new signed URL
        const { data, error: functionError } = await supabase.functions.invoke('get-course-video', {
          body: { videoPath },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        // Cache the URL
        videoUrlCache.set(videoPath, {
          url: data.signedUrl,
          expiresAt: data.expiresAt,
        });

        setVideoUrl(data.signedUrl);
      } catch (err) {
        console.error('Error fetching video URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
        setVideoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, [videoPath, session]);

  return { videoUrl, loading, error };
};