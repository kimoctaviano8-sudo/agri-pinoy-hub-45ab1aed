import { AspectRatio } from "@/components/ui/aspect-ratio";

interface NewsVideoEmbedProps {
  url: string;
}

const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === "youtu.be") {
      return parsed.pathname.replace("/", "");
    }

    if (host.includes("youtube.com")) {
      const idFromQuery = parsed.searchParams.get("v");
      if (idFromQuery) return idFromQuery;

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.replace("/embed/", "");
      }
    }

    return null;
  } catch {
    return null;
  }
};

const buildYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
};

const buildFacebookEmbedUrl = (url: string): string => {
  const encoded = encodeURIComponent(url);
  return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=0&width=560`;
};

export const NewsVideoEmbed = ({ url }: NewsVideoEmbedProps) => {
  let embedUrl: string | null = null;
  let isYouTube = false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com") || host === "youtu.be") {
      embedUrl = buildYouTubeEmbedUrl(url);
      isYouTube = true;
    } else if (host.includes("facebook.com") || host === "fb.watch") {
      embedUrl = buildFacebookEmbedUrl(url);
    }
  } catch {
    // Invalid URL, do not render video
  }

  if (!embedUrl) return null;

  return (
    <div className="my-4">
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-lg border border-border/60 bg-background"
          title={isYouTube ? "YouTube video player" : "Facebook video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </AspectRatio>
    </div>
  );
};
