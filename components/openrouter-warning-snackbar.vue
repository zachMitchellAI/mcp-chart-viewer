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
    <p>
      <span
        >Hey! This app needs an openrouter api key to run.
        <a href="https://openrouter.ai">Grab one!</a>
        <br />
        (Click the settings icon on the top-right corner to set)</span
      >
      <VBtn variant="tonal" @click="snackbar = false" color="red-darken-1">
        Gotcha
      </VBtn>
    </p>
  </VSnackbar>
</template>

<script setup>
const snackbar = ref(false);

onMounted(async () => {
  try {
    snackbar.value = await fetchNeedsApiKey();
    console.log("Needs API key?", snackbar.value);
  } catch (error) {
    console.error("Failed to check API key status", error);
  }
});
</script>
