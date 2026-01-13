# Interview SDK

A TypeScript monorepo that provides a software development kit for building interactive interview/questionnaire applications. The SDK is designed for creating dynamic, form-based interviews with rich UI components and business logic.

## Project Overview

This Interview SDK enables developers to build sophisticated questionnaire and survey applications with features like conditional logic, dynamic form controls, and multi-language support. The architecture allows interviews to be defined declaratively (via JSON) and rendered dynamically with a rich set of UI components.

## Packages

### Core Packages

#### `@imminently/interview-sdk` (`packages/core/`)

The core SDK for integrating interview functionality into custom UIs. This package handles all communication with the Decisively API and abstracts the core model and control logic, allowing you to focus on building your view layer.

**Key Features:**

- 🔄 **Session Management** - Create, load, and manage interview sessions with state persistence
- 🌐 **API Abstraction** - Clean interface for all API communications
- 📁 **File Handling** - Built-in file upload/download support
- ⚡ **Dynamic Updates** - Real-time form updates based on user input (client-side and server-side)
- 📘 **TypeScript Support** - Fully typed for better developer experience
- 🔐 **Flexible Authentication** - Support for custom auth configurations

**Main Components:**

- **SessionManager** - Main entry point for managing interview sessions
- **ApiManager** - Handles all HTTP API interactions
- **FileManager** - Manages file upload/download operations
- **Types** - Comprehensive TypeScript definitions

[📖 Full Documentation](./packages/core/README.md)

#### `@imminently/interview-ui` (`packages/ui/`)

A React UI component library for building interview experiences on top of `@imminently/interview-sdk`. This package provides ready-to-use React components with built-in styling, form management, and state handling.

**Key Features:**

- 🎨 **Pre-styled Components** - Beautiful, accessible interview UI out of the box
- 🧩 **Slot-based Customization** - Replace any component with your own implementation
- 📋 **Form Management** - Built-in form handling with validation
- 🔌 **Flexible Styling** - Use with Tailwind or standalone CSS
- ♿ **Accessible** - Built on Radix UI primitives following WAI-ARIA standards

**Main Components:**

- **Interview** - Compositional components (Interview.Form, Interview.Steps, Interview.Next, etc.)
- **InterviewProvider** - React context provider for interview state
- **Form Controls** - Pre-built form controls (text, date, currency, boolean, etc.)
- **Providers** - Theme and settings providers

[📖 Full Documentation](./packages/ui/README.md)

#### `@imminently/interview-sdk-theme-default` (`packages/theme-default/`)

> **Coming Soon** - This package is being restructured and will be available in a future release.

Default theme package with comprehensive styling capabilities for customizing the interview UI appearance.

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

- **Bun** for package management and script running
- **Turbo** for build orchestration and caching
- **TypeScript** for type safety
- **React** for UI components
- **Tailwind CSS** for styling
- **Vite** for development and building

### Scripts

```bash
# Install dependencies and build all packages
bun run install:all

# Start development servers for all packages
bun run dev

# Build all packages
bun run build

# Run linting across packages
bun run lint

# Clean all build artifacts
bun run clean

# Publish patch versions
bun run publish:patch
```

## Architecture

The SDK follows a modular architecture:

1. **Core Layer** (`@imminently/interview-sdk`) - Business logic and data management
2. **UI Layer** (`@imminently/interview-ui`) - React components and user interface
3. **Development Tools** (`dev-app`) - Testing and development environment

This separation allows for:

- **Flexibility** - Use different UI frameworks or customize existing components
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
