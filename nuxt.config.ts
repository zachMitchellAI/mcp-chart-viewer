// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "vuetify-nuxt-module", "@pinia/nuxt"],
  ssr: false,
  typescript: {
    typeCheck: true,
    tsConfig: {
      exclude: ["../drizzle-example"],
    },
  },
  build: {
    transpile: ["zod"],
  },
  hooks: {
    "prepare:types": ({ tsConfig }) => {
      if (tsConfig.compilerOptions) {
        delete tsConfig.compilerOptions.libReplacement;
      }
    },
  },
});
