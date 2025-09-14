// agents/projectFileManifest.js
// This file acts as a single source of truth for all files that AI agents
// are permitted to analyze and modify. It uses CommonJS syntax (module.exports)
// to be compatible with the Node.js agent scripts.

// IMPORTANT: This list should be updated if you add, remove, or rename files
// in the packages directory that you want the agents to interact with.

const editableFileManifest = [
  'packages/backend/api/config/supabase.js',
  'packages/backend/api/controllers/followUpController.js',
  'packages/backend/api/controllers/requestController.js',
  'packages/backend/api/controllers/triageController.js',
  'packages/backend/api/controllers/userController.js',
  'packages/backend/api/middleware/authMiddleware.js',
  'packages/backend/api/middleware/validationMiddleware.js',
  'packages/backend/api/routes/followUpRoutes.js',
  'packages/backend/api/routes/requestRoutes.js',
  'packages/backend/api/routes/triageRoutes.js',
  'packages/backend/api/routes/userRoutes.js',
  'packages/backend/api/server.js',
  'packages/backend/api/services/emailService.js',
  'packages/backend/api/validation/schemas.js',
  'packages/backend/netlify/functions/api.cjs',
  'packages/backend/netlify/functions/send-sms.cjs',
  'packages/frontend/src/features/admin/components/MapView.tsx',
  'packages/frontend/src/features/auth/AuthContext.tsx',
  'packages/frontend/src/features/auth/components/AuthModal.tsx',
  'packages/frontend/src/features/auth/components/UserMenu.tsx',
  'packages/frontend/src/features/landing/components/AboutSection.tsx',
  'packages/frontend/src/features/landing/components/ContactSection.tsx',
  'packages/frontend/src/features/landing/components/ReviewsSection.tsx',
  'packages/frontend/src/features/landing/components/ServicesSection.tsx',
  'packages/frontend/src/features/profile/components/ProfileModal.tsx',
  'packages/frontend/src/features/requests/components/AITriageSummary.tsx',
  'packages/frontend/src/features/requests/components/AttachmentSection.tsx',
  'packages/frontend/src/features/requests/components/CommunicationLog.tsx',
  'packages/frontend/src/features/requests/components/CustomerInfoSection.tsx',
  'packages/frontend/src/features/requests/components/Dashboard.tsx',
  'packages/frontend/src/features/requests/components/ModalFooter.tsx',
  'packages/frontend/src/features/requests/components/ModalHeader.tsx',
  'packages/frontend/src/features/requests/components/MyRequests.tsx',
  'packages/frontend/src/features/requests/components/QuoteAgentModal.tsx',
  'packages/frontend/src/features/requests/components/QuoteFormModal.tsx',
  'packages/frontend/src/features/requests/components/QuoteList.tsx',
  'packages/frontend/src/features/requests/components/RequestActions.tsx',
  'packages/frontend/src/features/requests/components/RequestDetailModal.tsx',
  'packages/frontend/src/features/requests/components/RequestProblemDetails.tsx',
  'packages/frontend/src/features/requests/hooks/useRequestMutations.ts',
  'packages/frontend/src/features/requests/hooks/useRequests.ts',
  'packages/frontend/src/features/requests/hooks/useRequestsQuery.ts',
  'packages/frontend/src/features/requests/types/index.ts',
  'packages/frontend/src/lib/apiClient.ts',
  'packages/frontend/src/lib/serviceQuoteQuestions.ts',
  'packages/frontend/src/lib/servicesData.ts',
  'packages/frontend/src/lib/statusColors.ts',
  'packages/frontend/src/lib/supabaseClient.ts',
  'packages/frontend/src/main.tsx',
  'packages/frontend/vite.config.js',
  'packages/frontend/index.html',
  'packages/frontend/public/plumber.jpg'
];

module.exports = {
  editableFileManifest
};