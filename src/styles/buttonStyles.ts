// Standardized Button Styles for Exam Pages
// This file contains consistent button styling classes to fix responsiveness issues

export const buttonStyles = {
  // Primary Action Buttons (Create, Submit, etc.)
  primary: {
    base: "flex items-center justify-center space-x-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[44px] md:min-h-[40px] md:px-6 md:py-2.5 md:text-base max-w-full md:flex-1 md:min-w-0",
    icon: "w-4 h-4 flex-shrink-0"
  },

  // Secondary Action Buttons (Cancel, Clear, etc.)
  secondary: {
    base: "flex items-center justify-center space-x-2 px-3 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[44px] md:min-h-[40px] md:px-6 md:py-2.5 md:text-base max-w-full md:flex-1 md:min-w-0",
    icon: "w-4 h-4 flex-shrink-0"
  },

  // Success Action Buttons (Approve, Complete, etc.)
  success: {
    base: "flex items-center justify-center space-x-2 px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[44px] md:min-h-[40px] md:px-6 md:py-2.5 md:text-base max-w-full md:flex-1 md:min-w-0",
    icon: "w-4 h-4 flex-shrink-0"
  },

  // Danger Action Buttons (Delete, Reject, etc.)
  danger: {
    base: "flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[44px] md:min-h-[40px] md:px-6 md:py-2.5 md:text-base max-w-full",
    icon: "w-4 h-4 flex-shrink-0"
  },

  // Outline Buttons (Cancel, Clear Selection, etc.)
  outline: {
    base: "flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm hover:shadow-md min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[44px] md:min-h-[40px] md:px-6 md:py-2.5 md:text-base max-w-full",
    icon: "w-4 h-4 flex-shrink-0"
  },

  // Small Action Buttons (Bulk actions, etc.)
  small: {
    base: "flex items-center justify-center space-x-1 px-3 py-2 text-xs font-medium rounded-md transition-colors shadow-sm hover:shadow-md min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[36px] md:min-h-[32px] md:px-4 md:py-1.5 md:text-sm max-w-full",
    icon: "w-3 h-3 flex-shrink-0"
  },

  // Pagination Buttons
  pagination: {
    base: "flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md transition-colors",
    responsive: "min-h-[36px] md:min-h-[32px] md:px-4 md:py-1.5",
    active: "bg-blue-600 text-white border-blue-600",
    inactive: "bg-white text-gray-700 hover:bg-gray-50",
    disabled: "opacity-50 cursor-not-allowed"
  },

  // Navigation Buttons (Previous/Next)
  navigation: {
    base: "flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[44px] sm:min-h-[40px] sm:px-6 sm:py-2.5 sm:text-base sm:rounded-xl max-w-full",
    icon: "w-4 h-4 flex-shrink-0"
  },

  // Submit Button (Special styling for exam submission)
  submit: {
    base: "flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium min-w-0 flex-shrink-0 overflow-hidden",
    responsive: "min-h-[44px] sm:min-h-[40px] sm:px-6 sm:py-2.5 sm:text-base sm:rounded-xl max-w-full",
    icon: "w-4 h-4 flex-shrink-0",
    disabled: "opacity-50 cursor-not-allowed"
  }
};

// Helper function to combine base and responsive styles
export const getButtonClass = (type: keyof typeof buttonStyles, additionalClasses = '') => {
  const style = buttonStyles[type];
  return `${style.base} ${style.responsive} ${additionalClasses}`;
};

// Helper function for button text classes (prevents overflow)
export const getButtonTextClass = () => {
  return "truncate whitespace-nowrap overflow-hidden";
};

// Helper function for icon classes
export const getIconClass = (type: keyof typeof buttonStyles) => {
  const style = buttonStyles[type];
  return 'icon' in style ? style.icon : 'w-4 h-4 flex-shrink-0'; // Default icon size
};

// Helper function for button container classes
export const getButtonContainerClass = () => {
  return "flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-3 w-full max-w-full overflow-hidden md:justify-start md:items-center";
};
