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
        }
      ]
    }
  }
];

export default eslintConfig;
