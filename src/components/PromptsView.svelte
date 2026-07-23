<script lang="ts">
  import { onMount } from "svelte";
  import { listPrompts, savePrompt, deletePrompt, searchPrompts } from "../storage/promptStore";
  import type { PromptTemplate } from "../types/prompt";
  import { generateId } from "../utils/tokenizer";

  let prompts = $state<PromptTemplate[]>([]);
  let searchQuery = $state("");
  let selectedCategory = $state("all");
  let showForm = $state(false);
  let editingId = $state<string | null>(null);
  let form = $state({
    name: "",
    content: "",
    description: "",
    category: "general",
    tags: "",
  });

  const CATEGORIES = ["general", "development", "systems", "devops", "security", "writing"];

  onMount(async () => {
    await load();

    document.getElementById("prompt-search")?.addEventListener("input", (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
      load();
    });

    document.getElementById("prompt-categories")?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest("[data-category]");
      if (btn) selectedCategory = btn.getAttribute("data-category")!;
    });

    document.getElementById("btn-new-prompt")?.addEventListener("click", () => {
      showForm = !showForm;
      if (showForm) resetForm();
      toggleFormVisibility();
      updateNewPromptBtn();
    });

    document.getElementById("btn-save-prompt")?.addEventListener("click", handleSave);

    document.getElementById("prompt-list")?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const el = target.closest("[data-prompt-id]");
      if (!el) return;
      const pid = el.getAttribute("data-prompt-id")!;
      const action = target.closest("[data-action]")?.getAttribute("data-action");
      if (action === "edit") {
        const p = prompts.find((pp) => pp.id === pid);
        if (p) handleEdit(p);
      } else if (action === "delete") {
        handleDelete(pid);
      } else if (action === "favorite") {
        const p = prompts.find((pp) => pp.id === pid);
        if (p) handleToggleFavorite(p);
      }
    });

    setupFormListeners();
  });

  function setupFormListeners() {
    const formContainer = document.getElementById("prompt-form");
    if (!formContainer) return;

    formContainer.addEventListener("input", (e) => {
      const el = e.target as HTMLElement;
      if (el.id === "pf-name") form.name = (el as HTMLInputElement).value;
      else if (el.id === "pf-description") form.description = (el as HTMLInputElement).value;
      else if (el.id === "pf-tags") form.tags = (el as HTMLInputElement).value;
      else if (el.id === "pf-content") form.content = (el as HTMLTextAreaElement).value;
    });

    formContainer.addEventListener("change", (e) => {
      const el = e.target as HTMLElement;
      if (el.id === "pf-category") form.category = (el as HTMLSelectElement).value;
    });
  }

  function toggleFormVisibility() {
    const form = document.getElementById("prompt-form");
    if (form) form.style.display = showForm ? "" : "none";
  }

  function updateNewPromptBtn() {
    const btn = document.getElementById("btn-new-prompt");
    if (btn) btn.textContent = showForm ? "Cancelar" : "+ Nuevo prompt";
  }

  async function load() {
    prompts = searchQuery ? await searchPrompts(searchQuery) : await listPrompts();
  }

  function resetForm() {
    form = { name: "", content: "", description: "", category: "general", tags: "" };
    editingId = null;
    const nameInput = document.getElementById("pf-name") as HTMLInputElement | null;
    if (nameInput) nameInput.value = "";
    const descInput = document.getElementById("pf-description") as HTMLInputElement | null;
    if (descInput) descInput.value = "";
    const tagsInput = document.getElementById("pf-tags") as HTMLInputElement | null;
    if (tagsInput) tagsInput.value = "";
    const contentArea = document.getElementById("pf-content") as HTMLTextAreaElement | null;
    if (contentArea) contentArea.value = "";
    const catSelect = document.getElementById("pf-category") as HTMLSelectElement | null;
    if (catSelect) catSelect.value = "general";
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) return;
    const prompt: PromptTemplate = {
      id: editingId || generateId(),
      name: form.name.trim(),
      content: form.content.trim(),
      description: form.description.trim(),
      category: form.category,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      variables: [],
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await savePrompt(prompt);
    resetForm();
    showForm = false;
    const formContainer = document.getElementById("prompt-form");
    if (formContainer) formContainer.style.display = "none";
    updateNewPromptBtn();
    await load();
  }

  async function handleEdit(p: PromptTemplate) {
    editingId = p.id;
    form = {
      name: p.name,
      content: p.content,
      description: p.description,
      category: p.category,
      tags: p.tags.join(", "),
    };
    const nameInput = document.getElementById("pf-name") as HTMLInputElement | null;
    if (nameInput) nameInput.value = p.name;
    const descInput = document.getElementById("pf-description") as HTMLInputElement | null;
    if (descInput) descInput.value = p.description;
    const tagsInput = document.getElementById("pf-tags") as HTMLInputElement | null;
    if (tagsInput) tagsInput.value = p.tags.join(", ");
    const contentArea = document.getElementById("pf-content") as HTMLTextAreaElement | null;
    if (contentArea) contentArea.value = p.content;
    const catSelect = document.getElementById("pf-category") as HTMLSelectElement | null;
    if (catSelect) catSelect.value = p.category;
    showForm = true;
    const formContainer = document.getElementById("prompt-form");
    if (formContainer) formContainer.style.display = "";
    updateNewPromptBtn();
  }

  async function handleDelete(id: string) {
    await deletePrompt(id);
    await load();
  }

  async function handleToggleFavorite(p: PromptTemplate) {
    p.favorite = !p.favorite;
    await savePrompt(p);
    await load();
  }

  const categories = $derived(Array.from(new Set(prompts.map((p) => p.category))));

  const filtered = $derived(
    prompts.filter((p) => selectedCategory === "all" || p.category === selectedCategory)
  );
</script>

<div class="max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-2xl font-semibold">Prompts</h1>
    <button id="btn-new-prompt" class="btn-primary text-sm">
      {showForm ? "Cancelar" : "+ Nuevo prompt"}
    </button>
  </div>

  <div id="prompt-form" class="card mb-6" style="display: {showForm ? '' : 'none'}">
    <div class="space-y-3">
      <input id="pf-name" placeholder="Nombre del prompt" class="input-field text-sm" value={form.name} />
      <input id="pf-description" placeholder="Descripción" class="input-field text-sm" value={form.description} />
      <div class="flex gap-3">
        <select id="pf-category" class="input-field text-sm">
          {#each CATEGORIES as cat}
            <option value={cat} selected={form.category === cat}>{cat}</option>
          {/each}
        </select>
        <input id="pf-tags" placeholder="Tags (separados por coma)" class="input-field text-sm flex-1" value={form.tags} />
      </div>
      <textarea
        id="pf-content"
        placeholder="Contenido del prompt..."
        rows="6"
        class="input-field text-sm font-mono"
      >{form.content}</textarea>
      <div class="flex justify-end">
        <button id="btn-save-prompt" class="btn-primary text-sm">
          {editingId ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </div>
  </div>

  <div class="flex items-center gap-3 mb-6">
    <input
      id="prompt-search"
      type="text"
      placeholder="Buscar prompts..."
      class="input-field text-sm w-64"
    />
    <div class="flex gap-1 flex-wrap" id="prompt-categories">
      <button
        data-category="all"
        class="px-2 py-1 text-xs rounded {selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}"
      >Todos</button>
      {#each categories as cat}
        <button
          data-category={cat}
          class="px-2 py-1 text-xs rounded {selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400'}"
        >{cat}</button>
      {/each}
    </div>
  </div>

  <div class="space-y-3" id="prompt-list">
    {#each filtered as prompt}
      <div class="card hover:border-gray-600 transition-colors" data-prompt-id={prompt.id}>
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-gray-200">{prompt.name}</h3>
              <button data-action="favorite" class="text-sm">
                {prompt.favorite ? "⭐" : "☆"}
              </button>
            </div>
            {#if prompt.description}
              <p class="text-sm text-gray-400 mt-1">{prompt.description}</p>
            {/if}
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{prompt.category}</span>
              {#each prompt.tags as tag}
                <span class="text-xs bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">#{tag}</span>
              {/each}
            </div>
          </div>
          <div class="flex items-center gap-1 ml-4">
            <button data-action="edit" class="btn-ghost text-xs p-1">✏️</button>
            <button data-action="delete" class="btn-ghost text-xs p-1">🗑️</button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>
