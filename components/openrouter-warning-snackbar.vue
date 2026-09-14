<style scoped>
p {
  text-align: center;
}
a {
  color: turquoise;
}
span {
  padding: 0.5em;
}
</style>

<template>
  <VSnackbar
    v-model="snackbar"
    timeout="-1"
    color="error"
    prepend-icon="mdi-cancel"
    rounded="pill"
    variant="tonal"
  >
    <template>
      <p>
        <span
          >Hey! This app needs an openrouter api key to run. Grab one by
          <a href="https://openrouter.ai"
            >Visiting their site and registering!</a
          >
          (See <code>.env</code> file in the root of this project)</span
        >
        <VBtn variant="tonal" @click="snackbar = false" color="red-darken-1">
          Gotcha
        </VBtn>
      </p>
    </template>
  </VSnackbar>
</template>

<script setup>
const snackbar = ref(false);

onMounted(async () => {
  try {
    snackbar.value = await fetchNeedsApiKey();
  } catch (error) {
    console.error("Failed to check API key status", error);
  }
});
</script>
