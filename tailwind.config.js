/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: "var(--body-font-family)",
        h1: "var(--h1-font-family)",
        h2: "var(--h2-font-family)",
        h3: "var(--h3-font-family)",
        helper: "var(--helper-font-family)",
        title: "var(--title-font-family)",
      },
    },
  },
  plugins: [],
};
