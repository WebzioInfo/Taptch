import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      ".pgdata/**",
      "scripts/**",
      ".agents/**",
      "tests/**",
      "*.config.*",
      "next-env.d.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default eslintConfig;
