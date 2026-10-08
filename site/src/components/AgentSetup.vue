<template>
  <div>
    <b-modal
      id="agent-setup-modal"
      title="Use QuACS with AI"
      @show="refreshNativeSupport"
    >
      <p>
        Let an AI agent search courses, check prerequisites and build your
        schedule. Copy this prompt into Claude Code, Cursor or any agent that
        supports MCP:
      </p>

      <div class="prompt-preview" data-cy="agent-prompt">{{ prompt }}</div>
      <b-button
        variant="primary"
        block
        data-cy="copy-agent-prompt"
        @click="copy(prompt, 'prompt')"
      >
        {{ copied === "prompt" ? "Copied!" : "Copy setup prompt" }}
      </b-button>

      <p class="browser-status" data-cy="browser-status">
        <template v-if="nativeSupport">
          <font-awesome-icon :icon="['fas', 'check']"></font-awesome-icon>
          WebMCP is on in this browser.
        </template>
        <template v-else-if="browser.chromiumVersion >= MIN_CHROMIUM">
          To let agents built into {{ browser.name }} use QuACS directly, open
          <code>{{ flagUrl }}</code
          >&nbsp;<a href="#" @click.prevent="copy(flagUrl, 'flag')">{{
            copied === "flag" ? "(copied)" : "(copy)"
          }}</a
          >, set it to Enabled and relaunch {{ browser.name }}.
          <template v-if="browser.name !== 'Chrome'">
            If you can't find it, use Chrome.
          </template>
        </template>
        <template v-else-if="browser.chromiumVersion > 0">
          Update {{ browser.name }} to let agents built into it use QuACS
          directly, then enable <code>{{ flagUrl }}</code
          >.
        </template>
        <template v-else>
          This browser doesn't support WebMCP yet. To let agents built into the
          browser use QuACS directly, use Chrome with
          <code>chrome://flags/#enable-webmcp-testing</code> enabled.
        </template>
      </p>

      <details>
        <summary>Manual setup</summary>
        <p>
          Run this in a terminal (Claude Code shown), then ask your agent to
          open <code>{{ siteUrl }}</code> and use its WebMCP tools:
        </p>
        <pre class="setup-command">{{ claudeCommand }}</pre>
        <a href="#" @click.prevent="copy(claudeCommand, 'command')">{{
          copied === "command" ? "Copied!" : "Copy command"
        }}</a>
      </details>

      <template v-slot:modal-footer="{ ok }">
        <small class="mr-auto">
          Problems or feedback?
          <a href="https://discord.gg/yXaHkwU" target="_blank" rel="noopener"
            >Join our Discord</a
          >
        </small>
        <b-button variant="secondary" @click="ok()"> Close </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BButton, BModal } from "bootstrap-vue";
import { trackAgentAction } from "@/webmcp";

const MCP_COMMAND =
  "npx -y chrome-devtools-mcp@latest --headless --isolated --categoryExperimentalWebmcp --chromeArg=--enable-features=WebMCP";

@Component({
  components: {
    "b-button": BButton,
    "b-modal": BModal,
  },
})
export default class AgentSetup extends Vue {
  copied: string | null = null;
  nativeSupport = false;
  // First Chromium release with the WebMCP flag
  MIN_CHROMIUM = 146;

  // Every Chromium browser has the flag, under its own flags page
  get browser(): { name: string; scheme: string; chromiumVersion: number } {
    const ua = navigator.userAgent;
    const chromium = ua.match(/Chrome\/(\d+)/);
    const chromiumVersion = chromium ? parseInt(chromium[1]) : 0;
    if (/Edg\//.test(ua)) {
      return { name: "Edge", scheme: "edge", chromiumVersion };
    } else if (/OPR\//.test(ua)) {
      return { name: "Opera", scheme: "opera", chromiumVersion };
    } else if (/Vivaldi\//.test(ua)) {
      return { name: "Vivaldi", scheme: "vivaldi", chromiumVersion };
    } else if ("brave" in navigator) {
      return { name: "Brave", scheme: "brave", chromiumVersion };
    }
    return { name: "Chrome", scheme: "chrome", chromiumVersion };
  }

  get flagUrl(): string {
    return `${this.browser.scheme}://flags/#enable-webmcp-testing`;
  }

  get siteUrl(): string {
    return window.location.origin + process.env.BASE_URL;
  }

  get claudeCommand(): string {
    return `claude mcp add --scope user quacs -- ${MCP_COMMAND}`;
  }

  get prompt(): string {
    return [
      `Set yourself up to use QuACS, the RPI course scheduler at ${this.siteUrl}, through the tools it exposes in the page.`,
      "",
      'Fastest: if you already have a browser tool that can run JavaScript in a page, open the URL and run `await window.quacsTools.list()` to see the tools and `await window.quacsTools.call("get_term_info", {})` to call one. No other setup is needed.',
      "",
      "Otherwise, add a browser bridge that supports WebMCP:",
      `1. Add an MCP server named "quacs" that runs: ${MCP_COMMAND}`,
      `   For example, in Claude Code: ${this.claudeCommand}`,
      "   In other agents, add the same command through their MCP settings.",
      "2. If the new server's tools aren't available yet, ask me to reload or restart your MCP servers however your agent supports it (for example, /reload-plugins in Claude Code), then continue from step 3.",
      `3. Use that server's navigate_page tool to open ${this.siteUrl}, call list_webmcp_tools to see the QuACS tools, and call them with execute_webmcp_tool, passing the tool input as a JSON string.`,
      "   That browser is headless and temporary, so anything you select there disappears when it closes. Give me the CRNs of the schedule you build.",
      "",
      "If a step fails, work around it yourself instead of stopping. Environments vary, so adapt the commands.",
      "",
      "To confirm it works, call get_term_info and tell me which semester QuACS is showing. Then help me plan my schedule.",
    ].join("\n");
  }

  refreshNativeSupport(): void {
    this.nativeSupport =
      document.modelContext !== undefined ||
      navigator.modelContext !== undefined;
    trackAgentAction("agent_setup_opened", {
      native_webmcp: this.nativeSupport,
      browser: this.browser.name,
      chromium_version: this.browser.chromiumVersion,
    });
  }

  async copy(text: string, which: string): Promise<void> {
    trackAgentAction("agent_setup_copied", { which });
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
.prompt-preview {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.8rem;
  max-height: 4.5em;
  overflow: hidden;
  padding: 0.5rem 0.75rem 0;
  border-radius: 6px 6px 0 0;
  background: rgba(127, 127, 127, 0.12);
  color: var(--global-text);
  -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent);
  mask-image: linear-gradient(to bottom, black 30%, transparent);
}

.browser-status {
  margin: 1rem 0 0.5rem;
  font-size: 0.9rem;
}

.setup-command {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.8rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: rgba(127, 127, 127, 0.12);
  color: var(--global-text);
}

summary {
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
