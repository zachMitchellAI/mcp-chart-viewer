<template>
  <v-row v-for="field in SETTING_FIELDS" :key="field.key" justify="center">
    <v-col cols="8">
      <v-list-subheader>{{ field.title }}</v-list-subheader>
      <v-text-field
        label=""
        :model-value="settings.get(field.key)"
        @update:model-value="valUpdate(field.key, $event)"
      ></v-text-field>
    </v-col>
  </v-row>
  <v-row justify="end">
    <v-col cols="auto">
      <v-btn text="Ok" @click="submitChanges"></v-btn>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
const emit = defineEmits<{ saved: [] }>();

const settings = ref(new Map<string, string>());

async function load(): Promise<void> {
  const results = await fetchUserSettings();
  for (const [key, value] of Object.entries(results)) {
    settings.value.set(key, value);
  }

  console.log(settings.value);
}

function valUpdate(key: string, evt: string) {
  console.log(key, evt);
  settings.value.set(key, evt);
}

async function submitChanges() {
  try {
    await saveUserSettings(Object.fromEntries(settings.value));
  } catch (error) {
    console.error("Failed to save settings", error);
    alert("Saving settings failed. Please try again.");
  } finally {
    emit("saved");
  }
}

onMounted(load);

defineExpose({ load });
</script>
