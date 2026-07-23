<script lang="ts">
  import { onMount } from "svelte";
  import { renderMarkdown, markdown } from "../utils/markdown";
  import { renderLatex } from "../utils/latex";
  import { copyToClipboard } from "../utils/clipboard";
  import type { Message as Msg } from "../types";

  let {
    message,
    editing = false,
    onedit = (_content: string) => {},
    ondelete = () => {},
    oncopy = () => {},
    onstartedit = () => {},
    oncanceledit = () => {},
  }: {
    message: Msg;
    editing?: boolean;
    onedit?: (content: string) => void;
    ondelete?: () => void;
    oncopy?: () => void;
    onstartedit?: () => void;
    oncanceledit?: () => void;
  } = $props();

  let editContent = $state(message.content);

  $effect(() => {
    editContent = message.content;
  });

  function handleSave() {
    onedit(editContent);
  }

  const rendered = $derived(
    message.role === "assistant" || message.role === "system"
      ? renderLatex(renderMarkdown(message.content))
      : ""
  );

  const isUser = message.role === "user";

  onMount(() => {
    const root = document.querySelector(`[data-msg-id="${message.id}"]`);
    if (!root) return;

    root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest("[data-action]")?.getAttribute("data-action");
      if (!action) return;

      if (action === "copy") {
        copyToClipboard(message.content);
        oncopy();
      } else if (action === "edit") {
        onstartedit();
      } else if (action === "delete") {
        ondelete();
      } else if (action === "save") {
        handleSave();
      } else if (action === "cancel") {
        oncanceledit();
      }
    });

    root.addEventListener("keydown", (e) => {
      const target = e.target as HTMLElement;
      const isEditArea = target.closest("[data-action='edit-area']");
      if (!isEditArea) return;
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        oncanceledit();
      }
    });

    root.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;
      if (target.getAttribute("data-action") === "edit-area") {
        editContent = (target as HTMLTextAreaElement).value;
      }
    });
  });
</script>

<div
  data-msg-id={message.id}
  class="group relative {isUser ? 'bg-primary-600/10 border border-primary-600/20' : 'bg-gray-800/50 border border-gray-700/50'} rounded-2xl {isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'} px-4 py-3"
>
  {#if editing}
    <div class="flex flex-col gap-2">
      <textarea
        data-action="edit-area"
        class="input-field min-h-[80px] text-sm font-mono"
      ></textarea>
      <div class="flex gap-2">
        <button data-action="save" class="btn-primary text-xs py-1 px-3">Guardar</button>
        <button data-action="cancel" class="btn-ghost text-xs py-1 px-3">Cancelar</button>
      </div>
    </div>
  {:else if isUser}
    <p class="text-sm text-gray-100 whitespace-pre-wrap">{message.content}</p>
  {:else}
    <div class="prose-custom text-sm">{@html rendered}</div>
  {/if}

  <div
    class="absolute -bottom-8 right-0 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-1.5 py-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
  >
    {#if !isUser}
      <button data-action="copy" class="p-1 text-gray-400 hover:text-gray-200 text-xs" title="Copiar">📋</button>
    {/if}
    <button data-action="edit" class="p-1 text-gray-400 hover:text-gray-200 text-xs" title="Editar">✏️</button>
    <button data-action="delete" class="p-1 text-gray-400 hover:text-red-400 text-xs" title="Eliminar">🗑️</button>
  </div>
</div>
