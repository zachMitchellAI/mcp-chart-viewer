<template>
  <v-dialog v-model="isOpen" :width="SETTING_MODAL_WIDTH">
    <v-card
      prepend-icon="mdi-cog-outline"
      text=""
      title="Configuration settings"
    >
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
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Ok" @click="submitChanges"></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>("isOpen", { default: false });

const settings = ref(new Map<string, string>());

watch(isOpen, async (newOpen) => {
  if (newOpen) {
    // Attempt to fetch the latest settings here
    const results = JSON.parse(
      await (await fetch("/api/user-settings")).text(),
    );
    for (const i in results) {
      settings.value.set(i, results[i]);
    }

    console.log(settings.value);
  }
});

function valUpdate(key: string, evt: string) {
  console.log(key, evt);
  settings.value.set(key, evt);
}

async function submitChanges() {
  try {
    const response = await fetch("/api/user-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(settings.value)),
    });
    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save settings", error);
    alert("Saving settings failed. Please try again.");
  } finally {
    isOpen.value = false;
  }
}
</script>
