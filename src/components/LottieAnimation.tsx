import React from "react";
import { Lottie } from "lottie-react";
import { useHydrated } from "@/lib/use-client-store";

interface LottieAnimationProps {
  animationData: Record<string, unknown>;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function LottieAnimation({
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
}: LottieAnimationProps) {
  const mounted = useHydrated();

  if (!mounted) {
    return <div className={className} style={style} />;
  }

  return (
    <Lottie
      src={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={style}
    />
  );
}
