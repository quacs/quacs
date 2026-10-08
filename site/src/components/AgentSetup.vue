<template>
  <div>
    <b-modal
      id="agent-setup-modal"
      title="Use QuACS with your AI agent"
      size="lg"
      @show="refreshNativeSupport"
    >
      <p>
        QuACS shares its course data with AI agents as
        <a
          href="https://webmachinelearning.github.io/webmcp/"
          target="_blank"
          rel="noopener"
          >WebMCP</a
        >
        tools. Your agent can search courses, check prerequisites, find sections
        that fit your week and build schedules for you. The tools run in the
        browser tab, so nothing is sent to a QuACS server.
      </p>

      <b-alert :variant="nativeSupport ? 'success' : 'secondary'" show>
        <span v-if="nativeSupport">
          This browser supports WebMCP, so QuACS tools are available to agents
          built into it right now.
        </span>
        <span v-else>
          This browser doesn't support WebMCP yet. Use the setup below to
          connect a coding agent.
        </span>
      </b-alert>

      <h5>Let your agent set it up</h5>
      <p>
        Paste this prompt into Claude Code, Cursor, Codex or any agent that can
        add MCP servers:
      </p>
      <b-button
        variant="primary"
        class="mb-2"
        data-cy="copy-agent-prompt"
        @click="copy(prompt, 'prompt')"
      >
        {{ copied === "prompt" ? "Copied!" : "Copy prompt" }}
      </b-button>
      <pre class="agent-setup-code" data-cy="agent-prompt">{{ prompt }}</pre>

      <hr />

      <h5>Set it up yourself</h5>
      <p>
        Agents outside the browser reach the tools through
        <a
          href="https://github.com/ChromeDevTools/chrome-devtools-mcp"
          target="_blank"
          rel="noopener"
          >Chrome DevTools MCP</a
        >, which opens a Chrome window with WebMCP turned on. For Claude Code,
        run:
      </p>
      <pre class="agent-setup-code">{{ claudeCommand }}</pre>
      <b-button
        variant="outline-primary"
        size="sm"
        @click="copy(claudeCommand, 'command')"
      >
        {{ copied === "command" ? "Copied!" : "Copy command" }}
      </b-button>
      <p class="mt-3">For other MCP clients, add this to the MCP config:</p>
      <pre class="agent-setup-code">{{ mcpConfig }}</pre>
      <b-button
        variant="outline-primary"
        size="sm"
        @click="copy(mcpConfig, 'config')"
      >
        {{ copied === "config" ? "Copied!" : "Copy config" }}
      </b-button>
      <p class="mt-3">
        Then ask your agent to open <code>{{ siteUrl }}</code> and use
        <code>list_webmcp_tools</code> and <code>execute_webmcp_tool</code>. The
        agent works in its own browser window, so schedules it builds there
        won't appear here; ask it for the CRNs.
      </p>

      <h5>Agents built into Chrome</h5>
      <p>
        Enable <code>chrome://flags/#enable-webmcp-testing</code>, restart
        Chrome and reload QuACS. Agents in the browser can then use the tools on
        this page directly, and anything they add to your schedule shows up
        here.
      </p>

      <p class="mt-3 mb-0">
        Problems or feedback? Come talk to us on
        <a href="https://discord.gg/yXaHkwU" target="_blank" rel="noopener"
          >Discord</a
        >.
      </p>

      <template v-slot:modal-footer="{ ok }">
        <b-button variant="primary" @click="ok()"> Close </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BAlert, BButton, BModal } from "bootstrap-vue";

const MCP_ARGS = [
  "-y",
  "chrome-devtools-mcp@latest",
  "--isolated",
  "--categoryExperimentalWebmcp",
  "--chromeArg=--enable-features=WebMCP",
];

@Component({
  components: {
    "b-alert": BAlert,
    "b-button": BButton,
    "b-modal": BModal,
  },
})
export default class AgentSetup extends Vue {
  copied: string | null = null;
  nativeSupport = false;

  get siteUrl(): string {
    return window.location.origin + process.env.BASE_URL;
  }

  get claudeCommand(): string {
    return `claude mcp add quacs -- npx ${MCP_ARGS.join(" ")}`;
  }

  get mcpConfig(): string {
    return JSON.stringify(
      { mcpServers: { quacs: { command: "npx", args: MCP_ARGS } } },
      null,
      2
    );
  }

  get prompt(): string {
    return [
      `Set yourself up to use QuACS, the RPI course scheduler at ${this.siteUrl}, through its WebMCP tools.`,
      "",
      "QuACS registers its tools in the browser with WebMCP (document.modelContext), so you need a browser bridge:",
      `1. Add an MCP server named "quacs" that runs: npx ${MCP_ARGS.join(" ")}`,
      `   In Claude Code that is: ${this.claudeCommand}`,
      "   For other clients, add the same command and args to your MCP config, then reload MCP servers (restart if needed).",
      `2. Use that server's navigate_page tool to open ${this.siteUrl}`,
      "3. Call list_webmcp_tools to see the QuACS tools, and call them with execute_webmcp_tool, passing the tool input as a JSON string.",
      "",
      "To confirm it works, call get_term_info and tell me which semester QuACS is showing. Then help me plan my schedule.",
    ].join("\n");
  }

  refreshNativeSupport(): void {
    this.nativeSupport =
      document.modelContext !== undefined ||
      navigator.modelContext !== undefined;
  }

  async copy(text: string, which: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API needs focus and permission; fall back to a hidden textarea
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    this.copied = which;
    setTimeout(() => {
      if (this.copied === which) {
        this.copied = null;
      }
    }, 2000);
  }
}
</script>

<style scoped>
.agent-setup-code {
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(127, 127, 127, 0.12);
  color: var(--global-text);
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.85rem;
}

h5 {
  margin-top: 1rem;
}
</style>
