/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        heading: ["'Plus Jakarta Sans'", "Outfit", "sans-serif"],
        editorial: ["'Newsreader'", "serif"],
        display: ["'Outfit'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },

      colors: {
        sage: {
          50: "#F3F7F4",
          100: "#E3ECE6",
          200: "#CBDCD0",
          300: "#ABC5B3",
          400: "#86A891",
          500: "#648A70",
          600: "#4D6E57",
          700: "#3E5746",
          800: "#2C4033",
          900: "#1E2D24",
          950: "#111A14",
        },

        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
        },

        civic: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },

        surface: {
          page: "#F4F7F4",
          soft: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          borderStrong: "#CBD5E1",
        },

        ink: {
          primary: "#0F172A",
          secondary: "#334155",
          muted: "#64748B",
          disabled: "#94A3B8",
        },

        status: {
          submitted: {
            bg: "#E0F2FE",
            text: "#0369A1",
            border: "#7DD3FC",
          },
          review: {
            bg: "#EDE9FE",
            text: "#6D28D9",
            border: "#C4B5FD",
          },
          info: {
            bg: "#FEF3C7",
            text: "#92400E",
            border: "#FCD34D",
          },
          verified: {
            bg: "#DBEAFE",
            text: "#1D4ED8",
            border: "#93C5FD",
          },
          assigned: {
            bg: "#CCFBF1",
            text: "#0F766E",
            border: "#5EEAD4",
          },
          progress: {
            bg: "#CFFAFE",
            text: "#0E7490",
            border: "#67E8F9",
          },
          waiting: {
            bg: "#FEF3C7",
            text: "#B45309",
            border: "#FCD34D",
          },
          resolved: {
            bg: "#DCFCE7",
            text: "#166534",
            border: "#86EFAC",
          },
          closed: {
            bg: "#E2E8F0",
            text: "#475569",
            border: "#CBD5E1",
          },
          reopened: {
            bg: "#FFE4E6",
            text: "#BE123C",
            border: "#FDA4AF",
          },
          rejected: {
            bg: "#FEE2E2",
            text: "#B91C1C",
            border: "#FCA5A5",
          },
          duplicate: {
            bg: "#F3E8FF",
            text: "#7E22CE",
            border: "#D8B4FE",
          },
          escalated: {
            bg: "#FFEDD5",
            text: "#C2410C",
            border: "#FDBA74",
          },
        },
      },

      boxShadow: {
        soft: "0 2px 10px -2px rgba(28, 48, 36, 0.04), 0 1px 3px 0 rgba(28, 48, 36, 0.06)",
        card: "0 8px 30px -6px rgba(28, 48, 36, 0.08)",
        elevated: "0 20px 40px -12px rgba(28, 48, 36, 0.12)",
        // Claymorphism 3D Shadows
        clay: "0 14px 28px -6px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04), inset 2px 2px 4px rgba(255, 255, 255, 0.95), inset -2px -2px 4px rgba(0, 0, 0, 0.04)",
        "clay-sm": "0 6px 14px -3px rgba(15, 23, 42, 0.06), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.03)",
        "clay-btn": "0 10px 20px -4px rgba(29, 78, 216, 0.22), inset 2px 2px 4px rgba(255, 255, 255, 0.4), inset -2px -2px 4px rgba(0, 0, 0, 0.2)",
        "clay-btn-sec": "0 6px 14px -3px rgba(15, 23, 42, 0.08), inset 2px 2px 4px rgba(255, 255, 255, 0.95), inset -2px -2px 4px rgba(0, 0, 0, 0.06)",
        "clay-inset": "inset 3px 3px 6px rgba(15, 23, 42, 0.06), inset -3px -3px 6px rgba(255, 255, 255, 0.9)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2.25rem",
        "4xl": "3rem",
      },

      animation: {
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 7s ease-in-out 2.5s infinite",
        "pulse-subtle": "pulseSubtle 4s ease-in-out infinite",
        "fade-slide-up": "fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      maxWidth: {
        content: "1440px",
      },
    },
  },
  plugins: [],
};
