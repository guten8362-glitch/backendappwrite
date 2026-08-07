import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getFileUrl } from "@/lib/appwrite/storage";

const resolveImageUrl = (urlOrId: string): string => {
  const trimmed = urlOrId.trim();
  if (!trimmed || trimmed === "Empty") return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      url.searchParams.delete("mode");
      url.searchParams.delete("impersonateuserid");
      return url.toString();
    } catch {
      return trimmed;
    }
  }
  if (trimmed.startsWith("/") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  // If it's an Appwrite File ID, convert it to full view URL
  try {
    const resolved = getFileUrl(trimmed);
    return resolved || trimmed;
  } catch {
    return trimmed;
  }
};

export function ImageCarousel({ 
  images, 
  className,
  imageClassName,
  style
}: { 
  images: string | string[];
  className?: string;
  imageClassName?: string;
  style?: React.CSSProperties;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const imageArray = Array.isArray(images) ? images : [images];
  
  // The user might paste multiple URLs/IDs separated by commas into a single string in Appwrite
  const parsedImages = imageArray.flatMap(img => typeof img === 'string' ? img.split(',') : []);

  const validImages = parsedImages
    .filter(img => typeof img === 'string' && img.trim() !== "Empty" && img.trim() !== "")
    .map(resolveImageUrl)
    .filter(Boolean);

  useEffect(() => {
    if (validImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(interval);
  }, [validImages.length]);

  if (validImages.length === 0) return null;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-muted", className)} style={style}>
      {validImages.map((src, index) => (
        <img
          key={src + index}
          src={src}
          alt={`Auditorium View ${index + 1}`}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out",
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0",
            imageClassName
          )}
        />
      ))}
    </div>
  );
}

