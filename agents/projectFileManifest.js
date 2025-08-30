// agents/projectFileManifest.js
// This file acts as a single source of truth for all files that AI agents
// are permitted to analyze and modify. It uses CommonJS syntax (module.exports)
// to be compatible with the Node.js agent scripts.

// IMPORTANT: This list should be updated if you add, remove, or rename files
// in the vite-app directory that you want the agents to interact with.

const editableFileManifest = [
  'vite-app/api/config/supabase.js',
  'vite-app/api/controllers/followUpController.js',
  'vite-app/api/controllers/requestController.js',
  'vite-app/api/controllers/triageController.js',
  'vite-app/api/controllers/userController.js',
  'vite-app/api/middleware/authMiddleware.js',
  'vite-app/api/middleware/validationMiddleware.js',
  'vite-app/api/routes/followUpRoutes.js',
  'vite-app/api/routes/requestRoutes.js',
  'vite-app/api/routes/triageRoutes.js',
  'vite-app/api/routes/userRoutes.js',
  'vite-app/api/server.js',
  'vite-app/api/services/emailService.js',
  'vite-app/api/validation/schemas.js',
  'vite-app/src/components/AboutSection.tsx',
  'vite-app/src/components/AttachmentSection.tsx',
  'vite-app/src/components/AuthModal.tsx',
  'vite-app/src/components/ContactSection.tsx',
  'vite-app/src/components/CustomerInfoSection.tsx',
  'vite-app/src/components/Dashboard.tsx',
  'vite-app/src/components/MyRequests.tsx',
  'vite-app/src/components/ProfileModal.tsx',
  'vite-app/src/components/QuoteAgentModal.tsx',
  'vite-app/src/components/QuoteFormModal.tsx',
  'vite-app/src/components/RequestDetailModal.tsx',
  'vite-app/src/components/ReviewsSection.tsx',
  'vite-app/src/components/ServicesSection.tsx',
  'vite-app/src/components/UserMenu.tsx',
  'vite-app/src/contexts/AuthContext.tsx',
  'vite-app/src/lib/apiClient.ts',
  'vite-app/src/lib/serviceQuoteQuestions.ts',
  'vite-app/src/lib/servicesData.ts',
  'vite-app/src/lib/statusColors.ts',
  'vite-app/src/lib/supabaseClient.ts',
  'vite-app/src/main.tsx',
  'vite-app/vite.config.js'
];

module.exports = {
  editableFileManifest
};