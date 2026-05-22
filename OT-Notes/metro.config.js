const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/realtime-js ships a `module` field pointing to ESM output that
// Metro can't resolve when supabase-js is imported via its .mjs entry.
// Disabling package-exports resolution forces Metro to use the `main` field.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
