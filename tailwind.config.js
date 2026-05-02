module.exports = {
  content: [
    "./index.html",
    "./Admin/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0066CC",
        secondary: "#0052A3",
        accent: "#004D99",
        deep: "#F8F9FA",
        surface: "#FFFFFF",
        "text-main": "#1a1a1a",
        "text-muted": "#666666",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
