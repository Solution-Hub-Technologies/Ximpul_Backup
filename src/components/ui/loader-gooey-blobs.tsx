import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LoaderGooeyBlobsProps extends Omit<
  HTMLMotionProps<"div">,
  "children"
> {
  size?: number;
  color?: string;
  duration?: number;
}

export function LoaderGooeyBlobs({
  className,
  size = 18,
  color = "currentColor",
  duration = 1.5,
  ...props
}: LoaderGooeyBlobsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)} {...props}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="gooey-x">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="gooey"
            />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>
      <div
        style={{ filter: "url(#gooey-x)" } as React.CSSProperties}
        className="flex gap-2 items-center justify-center"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="flex items-center justify-center font-black font-sans leading-none select-none"
            style={{
              fontSize: `${size}px`,
              color: color,
            }}
            animate={{
              x: [0, 15, 0, -15, 0],
              scale: [1, 1.25, 1, 1.25, 1],
            }}
            transition={{
              duration,
              ease: "easeInOut",
              repeat: Infinity,
              delay: index * 0.2,
            }}
          >
            X
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default LoaderGooeyBlobs;
