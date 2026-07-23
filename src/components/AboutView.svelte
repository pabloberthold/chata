<script lang="ts">
  import { APP_CONFIG } from "../config/app";
</script>

<div class="max-w-2xl mx-auto">
  <div class="text-center mb-12">
    <div class="text-6xl mb-4">🧠</div>
    <h1 class="text-3xl font-semibold mb-2">{APP_CONFIG.name}</h1>
    <p class="text-gray-400">v{APP_CONFIG.version}</p>
    <p class="text-gray-500 mt-4 max-w-md mx-auto">{APP_CONFIG.description}</p>
  </div>

  <div class="space-y-6">
    <section class="card">
      <h2 class="text-lg font-medium mb-3">Arquitectura</h2>
      <ul class="space-y-2 text-sm text-gray-400">
        <li>• <strong class="text-gray-300">Frontend:</strong> Astro + Svelte + TypeScript + TailwindCSS</li>
        <li>• <strong class="text-gray-300">SPA:</strong> 100% cliente. Sin backend. Despliegue en GitLab Pages.</li>
        <li>• <strong class="text-gray-300">Almacenamiento:</strong> IndexedDB (local). Sin servidores externos.</li>
        <li>• <strong class="text-gray-300">LLM:</strong> OpenRouter como proveedor inicial. Arquitectura extensible.</li>
        <li>• <strong class="text-gray-300">Plugins:</strong> Pipeline de plugins independientes (Alias, Variables, Máscaras, Memoria, etc.)</li>
      </ul>
    </section>

    <section class="card">
      <h2 class="text-lg font-medium mb-3">Características</h2>
      <div class="grid grid-cols-2 gap-3 text-sm">
        {#each [
          "Chat con streaming", "Markdown + LaTeX", "Syntax Highlight",
          "Agentes configurables", "Sistema de prompts", "Alias y máscaras",
          "Pipeline de plugins", "Exportar/Importar", "Múltiples modelos",
          "Editar mensajes", "Regenerar respuestas", "Historial completo",
        ] as feat}
          <div class="flex items-center gap-2 text-gray-400">
            <span class="text-green-400">✓</span>
            <span>{feat}</span>
          </div>
        {/each}
      </div>
    </section>

    <section class="card">
      <h2 class="text-lg font-medium mb-3">Preparado para el futuro</h2>
      <p class="text-sm text-gray-400 mb-3">
        La arquitectura está diseñada para incorporar sin reescrituras:
      </p>
      <ul class="space-y-1 text-sm text-gray-400">
        <li>• RAG (Recuperación aumentada)</li>
        <li>• MCP (Model Context Protocol)</li>
        <li>• Herramientas y funciones</li>
        <li>• Backend propio o Cloudflare Workers</li>
        <li>• Autenticación y multi-usuario</li>
        <li>• Proveedores adicionales (Ollama, LM Studio, OpenAI, Anthropic, Gemini)</li>
      </ul>
    </section>

    <section class="card text-center">
      <p class="text-sm text-gray-500">
        Creado por <a href="https://gitlab.com/pablo-iannucci" class="text-primary-400 hover:underline" target="_blank">Pablo Iannucci</a>
      </p>
      <p class="text-xs text-gray-600 mt-1">
        <a href={APP_CONFIG.repository} class="hover:text-gray-400" target="_blank">Repositorio</a>
      </p>
    </section>
  </div>
</div>
