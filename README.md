# Interview SDK

A TypeScript monorepo that provides a software development kit for building interactive interview/questionnaire applications. The SDK is designed for creating dynamic, form-based interviews with rich UI components and business logic.

## Project Overview

This Interview SDK enables developers to build sophisticated questionnaire and survey applications with features like conditional logic, dynamic form controls, theming, and multi-language support. The architecture allows interviews to be defined declaratively (via JSON) and rendered dynamically with a rich set of UI components.

## Packages

### Core Packages

#### `@imminently/interview-sdk` (`packages/core/`)
The main SDK package containing the core interview logic and utilities:

- **API utilities** - Core API interaction logic
- **Interview manager** - Main interview orchestration and state management
- **File manager** - File handling capabilities for interview assets
- **Types** - Comprehensive TypeScript definitions for controls, core types, and file handling
- **Utilities** - Helper functions for interview processing and data manipulation
- **Sidebars** - Sidebar component logic for navigation
- **Constants and formatting** - Shared constants and formatting utilities

#### `@imminently/interview-ui` (`packages/ui/`)
React UI components package providing the visual layer:

- **Interview components** - Main interview UI components and layouts
- **Form controls** - Reusable form control components (inputs, selects, etc.)
- **Providers** - React context providers including theme support
- **Utilities** - UI-specific helper functions
- **Internationalization** - Multi-language support system

#### `@imminently/interview-sdk-theme-default` (`packages/theme-default/`)
Default theme package with comprehensive styling:

- **Tailwind CSS configuration** - Custom Tailwind setup with safelist generation
- **Component styles** - Styled components for various form controls:
  - Boolean controls
  - Currency inputs
  - Date/DateTime/Time pickers
  - Text inputs
  - Error handling
  - Typography
- **Interview styles** - Styling for interview layouts, actions, alerts, and sidebars
- **Theme CSS** - Base theme styles and design system

### Development Environment

#### `dev-app/`
A development application for testing and demonstrating the SDK:

- **Vite-based React app** - Fast development environment
- **Interview playground** - Interactive testing interface for building interviews
- **UI browser** - Component showcase and documentation
- **Sample interviews** - Example interview definitions and configurations

## Key Features

- **Dynamic Form Controls** - Support for various input types (text, date, currency, boolean, etc.)
- **Conditional Logic** - Advanced branching and conditional display logic
- **File Handling** - Built-in support for file uploads and management
- **Theming System** - Comprehensive theming with Tailwind CSS
- **Multi-language Support** - Internationalization capabilities
- **Sidebar Navigation** - Configurable sidebar for interview navigation
- **Entity-based Data Model** - Flexible data modeling for complex interviews
- **TypeScript Support** - Full type safety throughout the SDK

## Development

This project uses:
- **Yarn Workspaces** for monorepo management
- **Turbo** for build orchestration and caching
- **TypeScript** for type safety
- **React** for UI components
- **Tailwind CSS** for styling
- **Vite** for development and building

### Scripts

```bash
# Install dependencies and build all packages
npm run install:all

# Start development servers for all packages
npm run dev

# Build all packages
npm run build

# Run linting across packages
npm run lint

# Clean all build artifacts
npm run clean

# Publish patch versions
npm run publish:patch
```

## Architecture

The SDK follows a modular architecture:

1. **Core Layer** (`@imminently/interview-sdk`) - Business logic and data management
2. **UI Layer** (`@imminently/interview-ui`) - React components and user interface
3. **Theme Layer** (`@imminently/interview-sdk-theme-default`) - Styling and visual design
4. **Development Tools** (`dev-app`) - Testing and development environment

This separation allows for:
- **Flexibility** - Use different UI frameworks or themes
- **Maintainability** - Clear separation of concerns
- **Extensibility** - Easy to add new features or customize existing ones
- **Reusability** - Components and logic can be shared across applications

## Use Cases

The Interview SDK is ideal for:
- **Enterprise surveys and questionnaires**
- **Interactive forms with complex logic**
- **Multi-step wizards and workflows**
- **Data collection applications**
- **Assessment and evaluation tools**
- **Customer onboarding flows**

## Documentation

Local documentation site (Next.js + fumadocs) lives in `docs/`.

Run locally:
```bash
bun install
bun run dev:docs
```

Build docs:
```bash
bun run build:docs
```