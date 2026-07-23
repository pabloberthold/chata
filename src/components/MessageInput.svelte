<script lang="ts">
  import { onMount } from "svelte";

  let {
    onsend = (_content: string) => {},
    streaming = false,
    onabort = () => {},
    onregenerate = () => {},
    hasMessages = false,
  }: {
    onsend?: (content: string) => void;
    streaming?: boolean;
    onabort?: () => void;
    onregenerate?: () => void;
    hasMessages?: boolean;
  } = $props();

  let input = $state("");

  function handleSubmit() {
    const content = input.trim();
    if (!content || streaming) return;
    onsend(content);
    input = "";
    const ta = document.getElementById("msg-input") as HTMLTextAreaElement | null;
    if (ta) {
      ta.value = "";
      ta.style.height = "auto";
      const sendBtn = document.getElementById("btn-send");
      if (sendBtn) sendBtn.disabled = true;
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  onMount(() => {
    const ta = document.getElementById("msg-input") as HTMLTextAreaElement | null;
    if (!ta) return;

    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    });

    ta.addEventListener("input", () => {
      input = ta.value;
      const sendBtn = document.getElementById("btn-send");
      if (sendBtn) sendBtn.disabled = !ta.value.trim();
      autoResize(ta);
    });

    document.getElementById("msg-buttons")?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("button");
      if (!btn) return;
      if (btn.id === "btn-send") handleSubmit();
      else if (btn.id === "btn-abort") onabort();
      else if (btn.id === "btn-regen") onregenerate();
    });
  });
</script>

<div class="flex items-end gap-2">
  <div class="flex-1 relative">
    <textarea
      id="msg-input"
      placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
      rows="1"
      class="input-field resize-none pr-12 min-h-[44px] max-h-[200px] text-sm"
      disabled={streaming}
    ></textarea>
  </div>

  <div class="flex items-center gap-1" id="msg-buttons">
    {#if streaming}
      <button id="btn-abort" class="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-lg transition-colors" title="Detener">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
      </button>
    {:else}
      {#if hasMessages}
        <button id="btn-regen" class="btn-ghost p-2" title="Regenerar última respuesta">🔄</button>
      {/if}
      <button
        id="btn-send"
        disabled
        class="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:text-gray-500 text-white p-2.5 rounded-lg transition-colors"
        title="Enviar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    {/if}
  </div>
</div>
