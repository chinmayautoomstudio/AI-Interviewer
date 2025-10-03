/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AI Interviewer Custom Color Palette
        'ai-teal': '#00a19d',      // Primary teal/mint green
        'ai-cream': '#fff8e5',     // Cream/off-white background
        'ai-orange': '#ffb344',    // Warm orange for highlights
        'ai-coral': '#e05d5d',     // Coral red for accents
        // Extended palette variations
        'ai-teal-dark': '#008a87',
        'ai-teal-light': '#33b3af',
        'ai-orange-dark': '#e6a23d',
        'ai-orange-light': '#ffc266',
        'ai-coral-dark': '#d14a4a',
        'ai-coral-light': '#e67e7e',
      },
      backgroundColor: {
        'ai-teal': '#00a19d',
        'ai-cream': '#fff8e5',
        'ai-orange': '#ffb344',
        'ai-coral': '#e05d5d',
      },
      textColor: {
        'ai-teal': '#00a19d',
        'ai-cream': '#fff8e5',
        'ai-orange': '#ffb344',
        'ai-coral': '#e05d5d',
      },
      borderColor: {
        'ai-teal': '#00a19d',
        'ai-cream': '#fff8e5',
        'ai-orange': '#ffb344',
        'ai-coral': '#e05d5d',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
