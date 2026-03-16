# Project Structure

### `src/`

- Contains all source code for the application.

### `app/`

- Houses the main `page.tsx`, the entry point for the frontend.

### `components/`

- Reusable UI components for different sections of the app.
  - `SearchBar/` - Includes `index.tsx` and `searchBar.scss` for the search bar UI.
  - `UserCardForm/` - User form component with styling.
  - `usersTable/` - User table UI.

### `library/`

- A shared custom UI reusable components

### `pages/`

- (Unused or for static page-based routing if applicable)

### `provider/`

- contains context providers for state management.

### `store/`

- Manages global state using Redux.
  - `hooks/` - Custom hooks for state interactions.
  - `slices/` - Redux slices, including `users.tsx` and `store.tsx`.

### `theme/`

- SCSS styles and theme configurations.
  - `colors.module.scss` - Color variables.
  - `common.module.scss` - Shared styles.
  - `gradient.module.scss` - Gradient styles.
  - `viewport.scss` - Responsive design styles.

### `types/`

- TypeScript type definitions.
  - `users.ts` - User-related type definitions.

### `utils/`

- Helper functions and configurations.
  - `schema.tsx` - contains form validation schemas.
  - `config.ts` - Configuration file.

---

## 🛠 Setup & Installation

### 1️⃣ Install Dependencies

```sh
npm install
```

### 2️⃣ Run the Development Server

```sh
npm run dev
```

- The app will run on `http://localhost:3000`

### 3️⃣ Build for Production

```sh
npm run build
```

- Generates optimized build files in `.next/`

---

## 🔧 Code Quality & Linting

### Run ESLint

```sh
npm run lint
```

### Format Code

"

```sh
npm run format
```

---

## 🚀 Deployment

1. Ensure `.env` variables are set.
2. Use `next build` and `next start` for deployment.
