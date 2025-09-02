import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "jest.config.js",
      "jest.setup.js"
    ],
  },
  {
    files: ["*.js", "*.mjs", "tailwind.config.js", "test-login.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Type consistency rules - ensure generated types are used
      "@typescript-eslint/no-type-alias": [
        "warn",
        {
          allowAliases: "in-unions",
          allowCallbacks: "always",
          allowConditionalTypes: "always",
          allowConstructors: "always",
          allowLiterals: "always",
          allowMappedTypes: "always",
          allowTupleTypes: "always"
        }
      ],

      // Prevent manual database type definitions
      "no-restricted-syntax": [
        "warn",
        {
          selector: "TSInterfaceDeclaration > Identifier[name=/^(User|Session|JournalEntry|EntryVersion|EntryShare|AuditLog|SystemConfig)Input$/]",
          message: "Use generated Prisma types from @/types/database instead of creating manual input interfaces."
        },
        {
          selector: "TSTypeAliasDeclaration > Identifier[name=/^(User|Session|JournalEntry|EntryVersion|EntryShare|AuditLog|SystemConfig)Type$/]",
          message: "Use generated Prisma types from @/types/database instead of creating manual type aliases."
        },
        {
          selector: "TSPropertySignature > Identifier[name=/^(id|email|firstName|lastName|role|title|content|status|mood|tags|createdAt|updatedAt)$/]",
          message: "Avoid manual property definitions. Use generated Prisma types instead."
        },

        // UI color rules (keeping existing)
        {
          selector: "Literal[value=/text-(red|green|blue|yellow|purple|indigo|pink|gray|slate)-[0-9]/]",
          message: "Use Text component with variant prop instead of hardcoded color classes like 'text-red-500'. Use variant='destructive' for red, variant='success' for green, etc."
        },
        {
          selector: "Literal[value=/bg-(red|green|blue|yellow|purple|indigo|pink|gray|slate)-[0-9]/]",
          message: "Use Button or Card variants instead of hardcoded background colors. Use variant='destructive', variant='primary', etc."
        },
        {
          selector: "Literal[value=/border-(red|green|blue|yellow|purple|indigo|pink|gray|slate)-[0-9]/]",
          message: "Use component variants instead of hardcoded border colors."
        },

        // Accessible component enforcement rules - more specific targeting
        {
          selector: "JSXElement[openingElement.name.name='h1']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true'])",
          message: "Use <Heading as='h1'> component instead of plain <h1> for accessibility and consistent styling. Example: <Heading as='h1' size='xl'>Title</Heading>"
        },
        {
          selector: "JSXElement[openingElement.name.name='h2']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true'])",
          message: "Use <Heading as='h2'> component instead of plain <h2> for accessibility and consistent styling. Example: <Heading as='h2' size='lg'>Subtitle</Heading>"
        },
        {
          selector: "JSXElement[openingElement.name.name='h3']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true'])",
          message: "Use <Heading as='h3'> component instead of plain <h3> for accessibility and consistent styling."
        },
        {
          selector: "JSXElement[openingElement.name.name='h4']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true'])",
          message: "Use <Heading as='h4'> component instead of plain <h4> for accessibility and consistent styling."
        },
        {
          selector: "JSXElement[openingElement.name.name='h5']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true'])",
          message: "Use <Heading as='h5'> component instead of plain <h5> for accessibility and consistent styling."
        },
        {
          selector: "JSXElement[openingElement.name.name='h6']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true'])",
          message: "Use <Heading as='h6'> component instead of plain <h6> for accessibility and consistent styling."
        },
        {
          selector: "JSXElement[openingElement.name.name='p']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true']):not(JSXElement[openingElement.attributes.0.name.name='role'][openingElement.attributes.0.value.value='alert'])",
          message: "Use <Text as='p'> component instead of plain <p> for accessibility and consistent styling. Example: <Text as='p' variant='muted'>Description</Text>"
        },
        {
          selector: "JSXElement[openingElement.name.name='span']:not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only)$/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true']):not(JSXElement[openingElement.attributes.0.name.name='aria-label']):not(JSXElement[openingElement.attributes.0.name.name='aria-labelledby']):not(JSXElement[openingElement.attributes.0.name.name='role'])",
          message: "Use <Text> component instead of plain <span> for accessibility and consistent styling. Example: <Text size='sm' variant='muted'>Label</Text>"
        },
        // Only target divs that are clearly used for text display, not layout
        {
          selector: "JSXElement[openingElement.name.name='div']:has(JSXText):not([openingElement.attributes.0.name.name='className'][openingElement.attributes.0.value.value=/^(sr-only|screen-reader-only|flex|grid|space-|items-|justify-|p-|m-|w-|h-)/]):not(JSXElement[openingElement.attributes.0.name.name='aria-hidden'][openingElement.attributes.0.value.value='true']):not(JSXElement[openingElement.attributes.0.name.name='role']):not(JSXElement[openingElement.attributes.0.name.name='aria-label']):not(JSXElement[openingElement.attributes.0.name.name='aria-labelledby']):not(JSXElement[openingElement.attributes.0.name.name='tabIndex']):not(JSXElement[openingElement.attributes.0.name.name='onClick']):not(JSXElement[openingElement.attributes.0.name.name='onKeyDown']):not(JSXElement[openingElement.attributes.0.name.name='children'])",
          message: "Consider using <Text as='div'> for divs containing text content. Use <div> only for layout containers. Example: <Text as='div' variant='muted'>Text content</Text>"
        }
      ]
    }
  }
];

export default eslintConfig;
