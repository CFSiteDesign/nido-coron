import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  /** Optional portrait cut, used on narrow screens. */
  srcPortrait?: string;
  poster: string;
  className?: string;
  label: string;
};

// Muted looping clip. The source is attached only when the video gets near
// the viewport (posters show until then) and playback pauses off-screen, so
// a page full of clips stays light on a phone.
export function LoopVideo({ src, srcPortrait, poster, className, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chosen =
      srcPortrait && window.matchMedia("(max-width: 767px)").matches ? srcPortrait : src;

    if (typeof IntersectionObserver === "undefined") {
      setActive(chosen);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setActive((cur) => cur ?? chosen);
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src, srcPortrait]);

  useEffect(() => {
    if (active) ref.current?.play().catch(() => {});
  }, [active]);

  return (
    <video
      ref={ref}
      className={cn("h-full w-full object-cover", className)}
      poster={asset(poster)}
      src={active ? asset(active) : undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
    />
  );
}
