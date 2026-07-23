<script lang="ts">
  import Message from "./Message.svelte";
  import MessageInput from "./MessageInput.svelte";
  import { sendMessage, regenerateMessage, abortChat } from "../services/chatService";
  import { getConversation, saveConversation } from "../storage/conversationStore";
  import { getAgent, listAgents } from "../storage/agentStore";
  import { getSettings, saveSettings, getApiKey } from "../storage/settingsStore";
  import { fetchModels } from "../services/modelService";
  import { refreshConvs } from "../stores/conv";
  import { exportAsMarkdown, exportAsJson, importFromJson, downloadFile } from "../services/exportService";
  import { generateId } from "../utils/tokenizer";
  import type { Conversation, Message as Msg } from "../types";
  import type { LLMModel } from "../providers/types";
  import { markdown } from "../utils/markdown";
  import { copyToClipboard } from "../utils/clipboard";
  import { onMount } from "svelte";

  const FREE_MODEL = "meta-llama/llama-3.2-3b-instruct:free";
  const FREE_AUTO = "openrouter/free";

  let currentConvId = $state("");
  let conv = $state<Conversation | null>(null);
  let messages = $state<Msg[]>([]);
  let agentName = $state("Asistente");
  let agentIcon = $state("🤖");
  let selectedModel = $state(FREE_MODEL);
  let selectedAgent = $state("");
  let models = $state<LLMModel[]>([]);
  let agents = $state<Array<{ id: string; name: string; icon: string }>>([]);
  let streaming = $state(false);
  let streamingContent = $state("");
  let errorMsg = $state("");
  let editingMsgId = $state<string | null>(null);
  let freeModels: LLMModel[] = [];
  let showExportMenu = $state(false);
  let showModelSelector = $state(false);
  let showAgentSelector = $state(false);

  function resolveModel(): string {
    if (selectedModel === FREE_AUTO) {
      if (freeModels.length > 0) return freeModels[0].id;
      return FREE_MODEL;
    }
    return selectedModel || FREE_MODEL;
  }

  function displayModel(): string {
    if (selectedModel === FREE_AUTO) return "openrouter/free";
    return selectedModel.split("/").pop() || selectedModel;
  }

  async function checkApiKey() {
    const key = await getApiKey();
    if (!key) errorMsg = "⚠️ Configurá tu API Key de OpenRouter en Settings para usar el chat";
  }

  function setUrlChatId(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("chat", id);
    window.history.pushState({}, "", url.pathname + url.search);
    currentConvId = id;
  }

  async function loadConversation() {
    const settings = await getSettings();
    if (!selectedModel) selectedModel = settings.defaultModel || FREE_MODEL;
    if (!selectedAgent) selectedAgent = settings.defaultAgent;
    const cid = currentConvId;
    if (!cid) { conv = null; messages = []; return; }
    const data = await getConversation(cid);
    if (data) {
      conv = data;
      messages = data.messages;
      selectedModel = data.modelId || settings.defaultModel || FREE_MODEL;
      selectedAgent = data.agentId || settings.defaultAgent;
      updateAgentInfo(data.agentId);
    } else {
      conv = null;
      messages = [];
      selectedModel = settings.defaultModel || FREE_MODEL;
      selectedAgent = settings.defaultAgent;
    }
  }

  async function updateAgentInfo(agentId: string) {
    const agent = await getAgent(agentId);
    if (agent) {
      agentName = agent.name;
      agentIcon = agent.icon;
      if (agent.preferredModel) selectedModel = agent.preferredModel;
    }
  }

  async function loadModels() {
    try {
      const list = await fetchModels();
      models = list;
      freeModels = list.filter((m) => m.id.includes(":free") || (m.pricing?.prompt === 0 && m.pricing?.completion === 0));
      if (selectedModel === FREE_AUTO && freeModels.length > 0) selectedModel = freeModels[0].id;
    } catch { models = []; }
  }

  async function loadAgents() {
    agents = (await listAgents()).map((a) => ({ id: a.id, name: a.name, icon: a.icon }));
  }

  async function handleSend(content: string) {
    if (!content.trim() || streaming) return;
    errorMsg = "";
    streaming = true;
    streamingContent = "";
    const cid = currentConvId || generateId();
    if (!currentConvId) setUrlChatId(cid);
    const model = resolveModel();
    await sendMessage(cid, content, model, selectedAgent,
      (chunk) => { streamingContent += chunk; },
      async () => { streaming = false; streamingContent = ""; await loadConversation(); refreshConvs(); },
      (err) => { streaming = false; errorMsg = "Error: " + err.message; loadConversation(); }
    );
  }

  async function handleRegenerate() {
    if (!currentConvId || streaming) return;
    errorMsg = "";
    streaming = true;
    streamingContent = "";
    const model = resolveModel();
    await regenerateMessage(currentConvId, model, selectedAgent,
      (chunk) => { streamingContent += chunk; },
      async () => { streaming = false; streamingContent = ""; await loadConversation(); refreshConvs(); },
      (err) => { streaming = false; errorMsg = "Error: " + err.message; loadConversation(); }
    );
  }

  function handleAbort() {
    abortChat();
    streaming = false;
    if (conv && streamingContent) {
      conv.messages.push({ id: generateId(), role: "assistant", content: streamingContent + "\n\n*[Generación interrumpida]*", timestamp: Date.now() });
      saveConversation(conv);
    }
    streamingContent = "";
    loadConversation();
  }

  async function handleEdit(msgId: string, newContent: string) {
    if (!conv) return;
    const msg = conv.messages.find((m) => m.id === msgId);
    if (msg) { msg.content = newContent; msg.timestamp = Date.now(); await saveConversation(conv); await loadConversation(); }
    editingMsgId = null;
  }

  async function handleDelete(msgId: string) {
    if (!conv) return;
    conv.messages = conv.messages.filter((m) => m.id !== msgId);
    await saveConversation(conv);
    await loadConversation();
  }

  async function handleRename(title: string) {
    if (!conv) return;
    conv.title = title;
    await saveConversation(conv);
    refreshConvs();
  }

  function handleExportMarkdown() { if (conv) downloadFile(exportAsMarkdown(conv), `${conv.title}.md`, "text/markdown"); }
  function handleExportJson() { if (conv) downloadFile(exportAsJson(conv), `${conv.title}.json`, "application/json"); }

  function handleImportJson() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = importFromJson(text);
      if (data && data.id) { await saveConversation(data as Conversation); refreshConvs(); setUrlChatId(data.id); }
    };
    input.click();
  }

  async function handleModelChange(modelId: string) {
    selectedModel = modelId === FREE_AUTO && freeModels.length > 0 ? freeModels[0].id : modelId;
    if (conv) { conv.modelId = selectedModel; await saveConversation(conv); }
    const s = await getSettings();
    s.defaultModel = selectedModel;
    await saveSettings(s);
    showModelSelector = false;
    const panel = document.getElementById("model-panel");
    if (panel) panel.classList.add("hidden");
  }

  async function handleAgentChange(agentId: string) {
    selectedAgent = agentId;
    updateAgentInfo(agentId);
    if (conv) { conv.agentId = agentId; await saveConversation(conv); }
    showAgentSelector = false;
    const panel = document.getElementById("agent-panel");
    if (panel) panel.classList.add("hidden");
  }

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    currentConvId = params.get("chat") || "";
    loadConversation();
    loadModels();
    loadAgents();
    checkApiKey();

    window.addEventListener("popstate", () => {
      const p = new URLSearchParams(window.location.search);
      currentConvId = p.get("chat") || "";
      loadConversation();
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest("[data-ca]")?.getAttribute("data-ca");
      if (!action) return;

      if (action === "comenzar") setUrlChatId(generateId());
      else if (action === "settings") window.location.href = "/chata/settings";
      else if (action === "toggle-agent") {
        const newVal = !showAgentSelector;
        showAgentSelector = newVal;
        showModelSelector = false;
        const panel = document.getElementById("agent-panel");
        if (panel) panel.classList.toggle("hidden", !newVal);
        const mpanel = document.getElementById("model-panel");
        if (mpanel) mpanel.classList.add("hidden");
      }
      else if (action === "toggle-model") {
        const newVal = !showModelSelector;
        showModelSelector = newVal;
        showAgentSelector = false;
        const panel = document.getElementById("model-panel");
        if (panel) panel.classList.toggle("hidden", !newVal);
        const apanel = document.getElementById("agent-panel");
        if (apanel) apanel.classList.add("hidden");
      }
      else if (action === "toggle-export") {
        showExportMenu = !showExportMenu;
        const menu = document.querySelector("[data-ca='export-menu']");
        if (menu) menu.classList.toggle("hidden", !showExportMenu);
      }
      else if (action === "export-md") handleExportMarkdown();
      else if (action === "export-json") handleExportJson();
      else if (action === "import-json") handleImportJson();

      else if (action === "select-model") {
        const id = target.closest("[data-ca]")?.getAttribute("data-model");
        if (id) handleModelChange(id);
      }
      else if (action === "select-agent") {
        const id = target.closest("[data-ca]")?.getAttribute("data-agent");
        if (id) handleAgentChange(id);
      }

      else if (action === "rename-save" || action === "rename-blur") {
        const val = target.closest("[data-ca]")?.getAttribute("data-value");
        if (val && conv) handleRename(val);
      }
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (showExportMenu && !target.closest("[data-ca='toggle-export']") && !target.closest("[data-ca='export-menu']")) {
        showExportMenu = false;
        const menu = document.querySelector("[data-ca='export-menu']");
        if (menu) menu.classList.add("hidden");
      }
    });

    document.addEventListener("keydown", (e) => {
      const target = e.target as HTMLElement;
      if (target.id === "conv-title" && e.key === "Enter") {
        target.blur();
      }
    });
    document.addEventListener("focusout", (e) => {
      const target = e.target as HTMLElement;
      if (target.id === "conv-title" && target.value.trim() && conv) {
        handleRename(target.value.trim());
      }
    });
  });
</script>

<div class="flex flex-col h-full chat-root">
  {#if !currentConvId}
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center max-w-lg px-8">
        <div class="text-6xl mb-6">🧠</div>
        <h1 class="text-2xl font-semibold mb-3">AI Workspace</h1>
        <p class="text-gray-400 mb-8">Chat multi-modelo con agentes inteligentes</p>
        {#if errorMsg}
          <div class="card bg-yellow-600/10 border-yellow-600/30 mb-6 text-left">
            <p class="text-sm text-yellow-400">{errorMsg}</p>
          </div>
        {/if}
        <button data-ca="comenzar" class="btn-primary">Comenzar</button>
      </div>
    </div>
  {:else}
    <div class="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-[#0f0f1a]">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span>{agentIcon}</span>
        <div class="min-w-0">
          <input type="text" value={conv?.title || "Nueva conversación"} id="conv-title" class="bg-transparent border-none outline-none text-sm font-medium text-gray-200 w-full truncate" />
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <button data-ca="toggle-agent" class="hover:text-gray-300">{agentName}</button>
            <span>·</span>
            <button data-ca="toggle-model" class="hover:text-gray-300">{displayModel()}</button>
          </div>
        </div>
      </div>
      <button data-ca="settings" class="btn-ghost text-xs" title="Configuración">⚙️</button>
      <div class="relative">
        <button data-ca="toggle-export" class="btn-ghost text-xs" title="Exportar/Importar">📥</button>
        <div data-ca="export-menu" class="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 w-44 hidden">
          <button data-ca="export-md" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-700">Exportar Markdown</button>
          <button data-ca="export-json" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-700">Exportar JSON</button>
          <button data-ca="import-json" class="w-full text-left px-3 py-2 text-sm hover:bg-gray-700">Importar JSON</button>
        </div>
      </div>
    </div>

    {#if errorMsg}
      <div class="px-4 py-2 bg-red-600/10 border-b border-red-600/30">
        <p class="text-sm text-red-400">{errorMsg}</p>
      </div>
    {/if}

    <div id="agent-panel" class="bg-gray-800 border-b border-gray-700 px-4 py-3 {showAgentSelector ? '' : 'hidden'}">
      <div class="flex flex-wrap gap-2">
        {#each agents as agent}
            <button data-ca="select-agent" data-agent={agent.id} class="px-3 py-1.5 rounded-lg text-sm transition-colors {selectedAgent === agent.id ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">
              {agent.icon} {agent.name}
            </button>
        {/each}
      </div>
    </div>

    <div id="model-panel" class="bg-gray-800 border-b border-gray-700 px-4 py-3 max-h-48 overflow-y-auto {showModelSelector ? '' : 'hidden'}">
      <div class="flex flex-wrap gap-2">
        <button data-ca="select-model" data-model="openrouter/free" class="px-3 py-1.5 rounded-lg text-sm transition-colors text-left max-w-xs truncate {selectedModel === FREE_AUTO || freeModels.length > 0 && selectedModel === freeModels[0].id ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">
          🆓 openrouter/free (auto)
        </button>
        {#each freeModels as model}
          <button data-ca="select-model" data-model={model.id} class="px-3 py-1.5 rounded-lg text-sm transition-colors text-left max-w-xs truncate {selectedModel === model.id ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">
            {model.name}
          </button>
        {/each}
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {#each messages as msg (msg.id)}
        <div class="message-row {msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}">
          <div class="max-w-[80%]">
            <Message
              message={msg}
              editing={editingMsgId === msg.id}
              onedit={(content) => handleEdit(msg.id, content)}
              ondelete={() => handleDelete(msg.id)}
              oncopy={() => copyToClipboard(msg.content)}
              onstartedit={() => editingMsgId = msg.id}
              oncanceledit={() => editingMsgId = null}
            />
          </div>
        </div>
      {/each}

      {#if streaming}
        <div class="flex justify-start">
          <div class="max-w-[80%]">
            <div class="bg-gray-800/50 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-700/50">
              {#if streamingContent}
                <div class="prose-custom text-sm">{@html markdown(streamingContent)}</div>
              {:else}
                <div class="flex items-center gap-1.5 py-2">
                  <span class="loading-dot w-2 h-2 bg-primary-400 rounded-full inline-block"></span>
                  <span class="loading-dot w-2 h-2 bg-primary-400 rounded-full inline-block"></span>
                  <span class="loading-dot w-2 h-2 bg-primary-400 rounded-full inline-block"></span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="border-t border-gray-800 px-4 py-3 bg-[#0f0f1a]">
      <MessageInput
        onsend={handleSend}
        streaming={streaming}
        onabort={handleAbort}
        onregenerate={handleRegenerate}
        hasMessages={messages.length > 0}
      />
    </div>
  {/if}
</div>
