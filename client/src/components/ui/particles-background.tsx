import React, { useCallback, useMemo } from "react";
import Particles from "react-particles";
import { Engine } from "tsparticles-engine";

export interface ParticlesBackgroundProps {
  variant?: "default" | "dots" | "network" | "stars" | "particles" | "bubbles";
  particleColor?: string;
  linkColor?: string;
  density?: "low" | "medium" | "high";
  interactive?: boolean;
  speed?: "slow" | "medium" | "fast";
}

export function ParticlesBackground({
  variant = "default",
  particleColor = "#0055ff",
  linkColor = "#0055ff33",
  density = "medium",
  interactive = true,
  speed = "medium",
}: ParticlesBackgroundProps) {
  
  // Convert density to a numeric value for the config
  const densityValue = useMemo(() => {
    switch (density) {
      case "low": return 30;
      case "medium": return 80;
      case "high": return 150;
    }
  }, [density]);
  
  // Convert speed to a numeric value for the config
  const speedValue = useMemo(() => {
    switch (speed) {
      case "slow": return 1;
      case "medium": return 3;
      case "fast": return 6;
    }
  }, [speed]);
  
  // Initialize the engine
  const particlesInit = useCallback(async (engine: Engine) => {
    const { loadSlim } = await import("tsparticles-slim");
    await loadSlim(engine);
  }, []);
  
  // Configure particles based on variant
  const options = useMemo(() => {
    const baseOptions = {
      fullScreen: {
        enable: true,
        zIndex: -1
      },
      fpsLimit: 60,
      particles: {
        color: {
          value: particleColor,
        },
        links: {
          color: linkColor,
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1
        },
        move: {
          enable: true,
          speed: speedValue,
          direction: "none",
          random: true,
          straight: false,
          outModes: {
            default: "out"
          }
        },
        number: {
          density: {
            enable: true,
            area: 800
          },
          value: densityValue
        },
        opacity: {
          value: 0.5,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.1,
            sync: false
          }
        },
        size: {
          value: 3,
          random: true
        }
      },
      interactivity: {
        detectsOn: "canvas",
        events: {
          onClick: {
            enable: interactive,
            mode: "push"
          },
          onHover: {
            enable: interactive,
            mode: "repulse"
          },
          resize: true
        }
      },
      detectRetina: true
    };
    
    // Apply variant-specific customizations
    switch (variant) {
      case "dots":
        return {
          ...baseOptions,
          particles: {
            ...baseOptions.particles,
            links: {
              ...baseOptions.particles.links,
              enable: false
            },
            size: {
              value: 4,
              random: true
            },
            opacity: {
              value: 0.6,
              random: true
            },
            move: {
              ...baseOptions.particles.move,
              speed: speedValue * 0.7
            }
          }
        };
        
      case "network":
        return {
          ...baseOptions,
          particles: {
            ...baseOptions.particles,
            links: {
              ...baseOptions.particles.links,
              opacity: 0.2,
              width: 1.5,
              triangles: {
                enable: true,
                opacity: 0.05
              }
            },
            move: {
              ...baseOptions.particles.move,
              speed: speedValue * 0.5
            }
          }
        };
        
      case "stars":
        return {
          ...baseOptions,
          particles: {
            ...baseOptions.particles,
            links: {
              ...baseOptions.particles.links,
              enable: false
            },
            size: {
              value: 2,
              random: true,
              anim: {
                enable: true,
                speed: 1,
                size_min: 0.1,
                sync: false
              }
            },
            move: {
              ...baseOptions.particles.move,
              speed: speedValue * 0.3
            },
            number: {
              ...baseOptions.particles.number,
              value: densityValue * 1.5
            }
          }
        };
        
      case "bubbles":
        return {
          ...baseOptions,
          particles: {
            ...baseOptions.particles,
            links: {
              ...baseOptions.particles.links,
              enable: false
            },
            size: {
              value: 6,
              random: true,
              anim: {
                enable: true,
                speed: 1,
                size_min: 0.3,
                sync: false
              }
            },
            opacity: {
              value: 0.3,
              random: true
            },
            move: {
              ...baseOptions.particles.move,
              speed: speedValue * 0.8,
              outModes: {
                default: "bounce"
              }
            }
          }
        };
        
      default: // default or "particles"
        return baseOptions;
    }
  }, [variant, particleColor, linkColor, densityValue, speedValue, interactive]);
  
  return <Particles id="tsparticles" init={particlesInit} options={options} />;
}