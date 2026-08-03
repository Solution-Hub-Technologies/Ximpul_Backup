import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  className?: string;
}

export function LiquidMetalButton({
  label = "New Lineup",
  onClick,
  viewMode = "text",
  className = "",
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: External library without types
  const shaderMount = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return {
        width: 40,
        height: 36,
        innerWidth: 36,
        innerHeight: 32,
        shaderWidth: 40,
        shaderHeight: 36,
      };
    } else if (isMobile) {
      return {
        width: 98,
        height: 26,
        innerWidth: 94,
        innerHeight: 22,
        shaderWidth: 98,
        shaderHeight: 26,
      };
    } else {
      return {
        width: 125,
        height: 34,
        innerWidth: 121,
        innerHeight: 30,
        shaderWidth: 125,
        shaderHeight: 34,
      };
    }
  }, [viewMode, isMobile]);

  useEffect(() => {
    const styleId = "shader-canvas-style-exploded";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = async () => {
      try {
        if (shaderRef.current) {
          if (shaderMount.current?.destroy) {
            shaderMount.current.destroy();
          }

          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: 4,
              u_softness: 0.5,
              u_shiftRed: 0.3,
              u_shiftBlue: 0.3,
              u_distortion: 0,
              u_contour: 0,
              u_angle: 45,
              u_scale: 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            0.6,
          );
        }
      } catch (error) {
        console.error("Failed to load shader:", error);
      }
    };

    loadShader();

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
    shaderMount.current?.setSpeed?.(1);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed?.(0.6);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMobile && shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => {
        if (isHovered) {
          shaderMount.current?.setSpeed?.(1);
        } else {
          shaderMount.current?.setSpeed?.(0.6);
        }
      }, 300);
    }

    if (!isMobile && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }

    onClick?.();
  };

  const activePressed = !isMobile && isPressed;
  const activeHovered = !isMobile && isHovered;
  const motionTransition = isMobile
    ? "none"
    : "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease";

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        style={{
          perspective: isMobile ? "none" : "1000px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: isMobile ? "flat" : "preserve-3d",
            transition: motionTransition,
            transform: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transformStyle: isMobile ? "flat" : "preserve-3d",
              transition: motionTransition,
              transform: isMobile ? "none" : "translateZ(20px)",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            {viewMode === "icon" && (
              <Sparkles
                size={14}
                style={{
                  color: "#ffffff",
                  filter: "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))",
                  transition: motionTransition,
                  transform: "scale(1)",
                }}
              />
            )}
            {viewMode === "text" && (
              <span
                style={{
                  fontSize: isMobile ? "9.5px" : "11px",
                  color: "#ffffff",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textShadow: "0px 1px 3px rgba(0, 0, 0, 0.9)",
                  transition: motionTransition,
                  transform: "scale(1)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            )}
          </div>

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: isMobile ? "flat" : "preserve-3d",
              transition: motionTransition,
              transform: isMobile ? "none" : `translateZ(10px) ${activePressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: `${dimensions.innerWidth}px`,
                height: `${dimensions.innerHeight}px`,
                margin: "2px",
                borderRadius: "100px",
                background: "linear-gradient(180deg, #181818 0%, #000000 100%)",
                boxShadow: activePressed
                  ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                  : "none",
                transition: motionTransition,
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: isMobile ? "flat" : "preserve-3d",
              transition: motionTransition,
              transform: isMobile ? "none" : `translateZ(0px) ${activePressed ? "translateY(1px) scale(0.98)" : "translateY(0) scale(1)"}`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: `${dimensions.width}px`,
                borderRadius: "100px",
                boxShadow: activePressed
                  ? "0px 0px 0px 1px rgba(255, 255, 255, 0.2), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)"
                  : activeHovered
                    ? "0px 0px 0px 1px rgba(255, 255, 255, 0.4), 0px 8px 12px 0px rgba(0, 0, 0, 0.3)"
                    : "0px 0px 0px 1px rgba(255, 255, 255, 0.25), 0px 4px 8px 0px rgba(0, 0, 0, 0.3)",
                transition: motionTransition,
                background: "rgb(0 0 0 / 0)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: `${dimensions.shaderWidth}px`,
                  maxWidth: `${dimensions.shaderWidth}px`,
                  height: `${dimensions.shaderHeight}px`,
                  transition: "width 0.4s ease, height 0.4s ease",
                }}
              />
            </div>
          </div>

          <button
            ref={buttonRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => !isMobile && setIsPressed(true)}
            onMouseUp={() => !isMobile && setIsPressed(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              outline: "none",
              zIndex: 40,
              transformStyle: isMobile ? "flat" : "preserve-3d",
              transform: isMobile ? "none" : "translateZ(25px)",
              transition: motionTransition,
              overflow: "hidden",
              borderRadius: "100px",
              WebkitTapHighlightColor: "transparent",
              WebkitTouchCallout: "none",
              userSelect: "none",
              touchAction: "manipulation",
            }}
            aria-label={label}
          >
            {!isMobile && ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)",
                  pointerEvents: "none",
                  animation: "ripple-animation 0.6s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
