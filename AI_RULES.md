# OfertaFlash Builder: Technical Rules and Guidelines

This document outlines the core technologies used in the OfertaFlash Builder application and provides clear rules for library usage to ensure consistency and maintainability.

## 1. Tech Stack Overview

The application is built using a modern, component-based architecture focused on speed and simplicity:

*   **Framework:** React (using functional components and hooks) with TypeScript for type safety.
*   **Build Tool:** Vite for rapid development and optimized bundling.
*   **Styling:** Tailwind CSS for a utility-first approach to responsive design.
*   **UI Components:** We prioritize using components from the `shadcn/ui` library for accessible and standardized UI elements.
*   **Icons:** All icons must be sourced from the `lucide-react` package.
*   **AI Services:** All interactions with the Gemini API (copy generation, product parsing, image generation) are handled exclusively via the official `@google/genai` SDK.
*   **Image Export:** The `html-to-image` library is used specifically for generating high-resolution PNG downloads of the poster canvas.
*   **Project Structure:** Components reside in `src/components/`, pages in `src/pages/`, and shared types in `types.ts`.

## 2. Library Usage Rules

| Purpose | Library/Technology | Rule |
| :--- | :--- | :--- |
| **UI Styling** | Tailwind CSS | Use utility classes for all styling, layout, and responsiveness. |
| **Standard UI Elements** | shadcn/ui | Use pre-built shadcn components (Button, Input, Card, etc.) whenever possible. |
| **Icons** | lucide-react | Only use icons imported from `lucide-react`. |
| **Generative AI** | @google/genai | All AI logic must be encapsulated in `services/geminiService.ts`. Do not call the API directly from components. |
| **State Management** | React Hooks | Use standard React hooks (`useState`, `useReducer`, `useContext`) for application state. |
| **High-Res Export** | html-to-image | Use this library only within the `PosterPreview` component for handling image downloads. |
| **Data Definitions** | TypeScript (`types.ts`) | All shared interfaces (e.g., `Product`, `PosterTheme`) must be defined in `types.ts`. |