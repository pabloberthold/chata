<script lang="ts">
  import { onMount } from "svelte";
  import { getSettings, saveSettings } from "../storage/settingsStore";
  import { getProvider } from "../providers/index";
  import AliasManager from "./AliasManager.svelte";
  import MaskManager from "./MaskManager.svelte";

  let validating = $state(false);

  onMount(async () => {
    const settings = await getSettings();
    const passwordInput = document.getElementById("api-key-input") as HTMLInputElement | null;
    const themeCheckbox = document.getElementById("theme-checkbox") as HTMLInputElement | null;
    const enterCheckbox = document.getElementById("enter-checkbox") as HTMLInputElement | null;
    const validateBtn = document.getElementById("btn-validate");
    const saveBtn = document.getElementById("btn-save");
    const clearBtn = document.getElementById("btn-clear");
    const backBtn = document.getElementById("btn-back");
    const statusEl = document.getElementById("validation-status");

    if (passwordInput && settings.openRouterKey) {
      passwordInput.value = settings.openRouterKey;
    }
    if (themeCheckbox) {
      themeCheckbox.checked = settings.theme === "light";
    }
    if (enterCheckbox) {
      enterCheckbox.checked = settings.enterToSend;
    }

    function applyTheme(light: boolean) {
      document.documentElement.classList.toggle("light", light);
    }
    applyTheme(settings.theme === "light");

    backBtn?.addEventListener("click", () => {
      window.location.href = "/chata/";
    });

    themeCheckbox?.addEventListener("change", (e) => {
      const light = (e.target as HTMLInputElement).checked;
      applyTheme(light);
      getSettings().then((s) => {
        s.theme = light ? "light" : "dark";
        saveSettings(s);
      });
    });

    enterCheckbox?.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      getSettings().then((s) => {
        s.enterToSend = checked;
        saveSettings(s);
      });
    });

    validateBtn?.addEventListener("click", async () => {
      validating = true;
      if (statusEl) {
        statusEl.textContent = "Validando...";
        statusEl.className = "text-sm text-yellow-400";
      }
      try {
        const key = passwordInput?.value || "";
        const cur = await getSettings();
        cur.openRouterKey = key;
        await saveSettings(cur);
        const ok = await getProvider().validateKey();
        if (statusEl) {
          statusEl.textContent = ok ? "✓ API Key válida" : "✗ API Key inválida";
          statusEl.className = ok ? "text-sm text-green-400" : "text-sm text-red-400";
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = "Error: " + (err instanceof Error ? err.message : String(err));
          statusEl.className = "text-sm text-red-400";
        }
      } finally {
        validating = false;
      }
    });

    saveBtn?.addEventListener("click", async () => {
      try {
        const cur = await getSettings();
        const key = passwordInput?.value || "";
        if (key) cur.openRouterKey = key;
        cur.enterToSend = enterCheckbox?.checked ?? cur.enterToSend;
        cur.theme = themeCheckbox?.checked ? "light" : "dark";
        await saveSettings(cur);
        saveBtn.textContent = "✓ Guardado";
        setTimeout(() => { saveBtn.textContent = "Guardar configuración"; }, 2000);
      } catch (err) {
        alert("Error: " + (err instanceof Error ? err.message : String(err)));
      }
    });

    clearBtn?.addEventListener("click", async () => {
      if (passwordInput) passwordInput.value = "";
      const cur = await getSettings();
      cur.openRouterKey = "";
      await saveSettings(cur);
      if (statusEl) {
        statusEl.textContent = "";
        statusEl.className = "text-sm";
      }
    });
  });
</script>

<div class="max-w-2xl mx-auto">
  <div class="flex items-center gap-4 mb-8">
    <button id="btn-back" class="btn-ghost text-sm">&larr; Volver al chat</button>
    <h1 class="text-2xl font-semibold">Configuración</h1>
  </div>

  <div class="space-y-8">
    <section class="card">
      <h2 class="text-lg font-medium mb-4">OpenRouter</h2>
      <p class="text-sm text-gray-400 mb-4">
        Ingresa tu API Key de OpenRouter. La clave se almacena únicamente en IndexedDB (local) y nunca se comparte.
      </p>
      <div class="space-y-3">
        <div>
          <label class="block text-sm text-gray-300 mb-1">API Key</label>
          <input
            type="password"
            id="api-key-input"
            placeholder="sk-or-v1-..."
            class="input-field font-mono text-sm w-full"
          />
        </div>
        <div class="flex items-center gap-3">
          <button id="btn-validate" class="btn-primary text-sm">
            Validar API Key
          </button>
          <button id="btn-clear" class="btn-ghost text-sm">Limpiar</button>
        </div>
        <p id="validation-status" class="text-sm"></p>
      </div>
    </section>

    <section class="card">
      <h2 class="text-lg font-medium mb-4">Preferencias</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-sm text-gray-300">Enter para enviar</label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input id="enter-checkbox" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div class="flex items-center justify-between">
          <label class="text-sm text-gray-300">Tema claro</label>
          <label class="relative inline-flex items-center cursor-pointer">
            <input id="theme-checkbox" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="text-lg font-medium mb-4">Alias</h2>
      <p class="text-sm text-gray-400 mb-4">
        Los alias reemplazan texto antes de enviar al LLM. Ejemplo: linux1 → srv-rhel09
      </p>
      <AliasManager />
    </section>

    <section class="card">
      <h2 class="text-lg font-medium mb-4">Máscaras</h2>
      <p class="text-sm text-gray-400 mb-4">
        Las máscaras ocultan información sensible antes de enviar al LLM y la restauran en la respuesta.
      </p>
      <MaskManager />
    </section>

    <div class="flex justify-end">
      <button id="btn-save" class="btn-primary">
        Guardar configuración
      </button>
    </div>
  </div>
</div>
