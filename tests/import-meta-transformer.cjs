// Custom transformer to replace import.meta.env with process.env for Jest
const { default: tsJest } = require('ts-jest');

// Create ts-jest transformer
const tsJestTransformer = tsJest.createTransformer({
  tsconfig: {
    module: 'commonjs',
    target: 'ES2020',
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    jsx: 'react-jsx',
    skipLibCheck: true
  }
});

module.exports = {
  process(sourceText, sourcePath, config) {
    // Transform import.meta.env.X to process.env.X
    let transformedSource = sourceText
      .replace(/import\.meta\.env\.VITE_GEMINI_API_KEY/g, 'process.env.VITE_GEMINI_API_KEY')
      .replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, 'process.env.VITE_SUPABASE_URL')
      .replace(/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/g, 'process.env.VITE_SUPABASE_ANON_KEY')
      .replace(/import\.meta\.env\.DEV/g, '(process.env.NODE_ENV === "development")')
      .replace(/import\.meta\.env\.PROD/g, '(process.env.NODE_ENV === "production")');

    // Then use ts-jest to compile TypeScript
    return tsJestTransformer.process(transformedSource, sourcePath, config);
  }
};
