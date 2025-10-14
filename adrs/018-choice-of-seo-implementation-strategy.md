# ADR-018: Choice of SEO Implementation Strategy

**Date:** 2025-10-07

**Status:** Decided & Implemented

## Context

The PlumbingPOC application required comprehensive SEO optimization to improve search engine visibility and local search rankings. As a Single Page Application (SPA), it faced inherent SEO challenges including dynamic content rendering, lack of server-side meta tag management, and absence of structured data markup. The implementation needed to address technical SEO, on-page SEO, and local SEO while maintaining the React SPA architecture.

## Decision

We will implement a comprehensive SEO strategy using **react-helmet-async** for dynamic meta tag management, combined with JSON-LD structured data markup and content optimization techniques. This approach provides:

1. **Dynamic Meta Tag Management**: react-helmet-async for title, description, and other meta tags
2. **Local Business Schema Markup**: JSON-LD structured data for Google Business Profile integration
3. **Content Optimization**: Local keyword integration and improved accessibility
4. **Technical SEO**: Proper document head management for SPA routing

## Implementation Details

### Technical SEO Implementation
- **react-helmet-async**: Provides HelmetProvider context and Helmet component for dynamic document head management
- **SPA Routing Support**: Meta tags update dynamically based on route changes
- **Server-Side Rendering Ready**: Architecture supports future SSR implementation if needed

### Local Business Schema Markup
- **Dynamic JSON-LD**: Structured data generated dynamically in React using Helmet
- **Environment-Aware URLs**: Schema URLs automatically use current domain (window.location.origin)
- **Business Information**: Complete local business details including address, phone, hours, and service area
- **GeoCoordinates**: Precise location data for local search optimization
- **Opening Hours**: 24/7 availability specification
- **Social Media Links**: Facebook and Instagram integration

### On-Page SEO Optimization
- **Header Tag Optimization**: H2 tags updated with local keywords ("Victoria, BC")
- **Image Alt Text**: Descriptive alt attributes for accessibility and image search
- **Content Enhancement**: Local area mentions (Oak Bay, Saanich, Langford) in about section

## Consequences

*   **Pros:**
    *   **SPA Compatibility**: react-helmet-async specifically designed for React SPAs, providing reliable meta tag management
    *   **Local Search Optimization**: JSON-LD schema markup directly supports Google My Business and local pack rankings
    *   **Search Engine Friendly**: Structured data helps search engines understand business information and services
    *   **Future-Proof**: Architecture supports additional SEO features like Open Graph and Twitter Cards
    *   **Performance**: Lightweight library with minimal bundle impact
    *   **Accessibility**: Improved alt text benefits both SEO and screen readers

*   **Cons:**
    *   **SPA Limitations**: Client-side rendering means initial page loads lack meta tags until JavaScript executes
    *   **Additional Dependency**: react-helmet-async adds to bundle size (though minimal)
    *   **Maintenance**: Schema markup requires updates when business information changes
    *   **Limited Server-Side SEO**: No server-side rendering means slower initial indexing

*   **Implementation Notes:**
    *   HelmetProvider wraps the entire App component for global context
    *   Dynamic meta tags and schema markup set in renderHomePage function using Helmet
    *   Schema URLs automatically resolve to current domain for environment flexibility
    *   Content updates made to ServicesSection and AboutSection components

*   **Alternatives Considered:**
    *   **Server-Side Rendering (Next.js/Nuxt)**: Would provide better initial SEO but significantly increase complexity and hosting requirements
    *   **Static Site Generation**: Not suitable for dynamic application with real-time features
    *   **Manual Meta Tag Management**: Error-prone and difficult to maintain across routes
    *   **SEO Libraries (React SEO, etc.)**: react-helmet-async provides better React integration and active maintenance

## Related Decisions

- ADR-004: Choice of Frontend Framework (React)
- ADR-005: Choice of Hosting and Deployment Platform (Netlify)
- ADR-015: Choice of Monorepo Structure

## Future Considerations

- Monitor Core Web Vitals impact
- Consider implementing Open Graph meta tags for social sharing
- Evaluate need for server-side rendering as application scales
- Regular updates to schema markup for changing business information
