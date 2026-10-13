<template>
  <Network
    ref="network"
    :nodes="nodes"
    :edges="edges"
    :options="options"
  ></Network>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

// @ts-expect-error: No types for this, unfortunately
import * as VueVisJs from "vue-visjs";
const Network = VueVisJs.Network;

interface Node {
  id: number;
  label: string;
  depth: number;
  color: Color;
  font: {
    size: number;
    color?: string;
  };
}

interface Edge {
  from: number;
  to: number;
}

interface Graph {
  nodes: Node[];
  edges: Edge[];
}

type RGBA = [number, number, number, number];

// Any CSS color as [r, g, b, a] (0-255, alpha 0-1), as the browser computes it
function parseColor(color: string): RGBA | null {
  const probe = document.createElement("span");
  probe.style.color = color;
  if (!probe.style.color) {
    return null;
  }
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const parts = computed.match(/[\d.]+/g)?.map(Number);
  if (!parts || parts.length < 3) {
    return null;
  }
  return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
}

// WCAG relative luminance and contrast ratio
function luminance([r, g, b]: RGBA): number {
  const channel = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

interface Color {
  background: string;
  border: string;
  highlight: {
    background: string;
    border: string;
  };
}

@Component({
  components: {
    Network,
  },
})
export default class PrereqGraph extends Vue {
  @Prop() readonly course!: string;

  // The text color around the graph, which the theme made readable on whatever is behind it. Read
  // once the graph is on the page (see textColor).
  surroundingText = "";

  mounted(): void {
    this.surroundingText = getComputedStyle(this.$el).color;
  }

  get options(): unknown {
    return {
      width: "100%",
      height: "200px",
      nodes: {
        shape: "box",
      },
      edges: {
        arrows: {
          to: {
            enabled: true,
          },
        },
      },
      layout: {
        randomSeed: 0,
      },
    };
  }

  get nodes(): Node[] {
    return this.graph().nodes;
  }

  get edges(): Edge[] {
    return this.graph().edges;
  }

  colorHelper(index: number): Color {
    const css = getComputedStyle(document.documentElement);
    const bg = css.getPropertyValue("--calendar-bg-color-" + index);
    const border = css.getPropertyValue("--calendar-border-color-" + index);
    return {
      background: bg,
      border: border,
      highlight: {
        background: bg,
        border: border,
      },
    };
  }

  // Given a node index, return the node's color
  color(index: number): Color {
    const css = getComputedStyle(document.documentElement);
    return this.colorHelper(
      index % Number(css.getPropertyValue("--num-calendar-colors"))
    );
  }

  // A label color that reads well on the node (vis-network's default is a fixed dark gray). The theme
  // pairs each calendar color with a text color, but some themes made those for a calendar unlike
  // the dialog the graph sits in (white text on faint fills meant for a dark panel). So the node's
  // fill is laid over the dialog, assumed light or dark like the opposite of its text, and the
  // first color that reads well wins: the theme's, then the dialog's own text color, then black or
  // white, whichever reads better.
  textColor(index: number, fill: string): string | undefined {
    const css = getComputedStyle(document.documentElement);
    const i = index % Number(css.getPropertyValue("--num-calendar-colors"));
    const themed = css.getPropertyValue("--calendar-text-color-" + i).trim();
    const around = parseColor(this.surroundingText);
    const node = parseColor(fill);
    if (!around || !node) {
      return themed || undefined;
    }
    const backdrop: RGBA =
      luminance(around) < 0.4 ? [255, 255, 255, 1] : [24, 24, 24, 1];
    const a = node[3];
    const shown: RGBA = [
      node[0] * a + backdrop[0] * (1 - a),
      node[1] * a + backdrop[1] * (1 - a),
      node[2] * a + backdrop[2] * (1 - a),
      1,
    ];
    const candidates = [themed, this.surroundingText, "#000", "#fff"]
      .map((color) => ({ color, rgba: parseColor(color) }))
      .filter((c): c is { color: string; rgba: RGBA } => c.rgba !== null);
    const readable = candidates.find((c) => contrast(c.rgba, shown) >= 4.5);
    if (readable) {
      return readable.color;
    }
    return candidates.sort(
      (x, y) => contrast(y.rgba, shown) - contrast(x.rgba, shown)
    )[0]?.color;
  }

  graph(): Graph {
    // Get prereq_graph.json
    const prereqGraph = this.$store.state.prereqGraph;

    // Recursive function to get list of courses that should display as nodes
    function getCourses(root: string): string[] {
      return Array.from(
        new Set(
          [root].concat(prereqGraph[root]?.prereqs.map(getCourses).flat() || [])
        )
      );
    }

    // Get list of courses that should display as nodes
    const courses = getCourses(this.course);
    // Convert to list of nodes
    const nodes: Node[] = Array.from(courses.entries()).map(([id, course]) => ({
      id: id,
      label: course,
      depth: Infinity, // Changed later
      color: this.color(0), // Changed later
      font: {
        // The root node (the class in the `course` property) is larger
        size: id === 0 ? 24 : 14,
      },
    }));

    // Recursive function to get list of edges between nodes.
    // This function also fills in the `depth` field of nodes
    // with their distance to the root node.
    function getEdges(
      node_id: number, // ID of current node to visit
      depth: number // Distance to root node
    ): { from: number; to: number }[] {
      // Update node's depth
      nodes[node_id].depth = Math.min(nodes[node_id].depth, depth);

      // Current course's prereqs
      const prereqs = prereqGraph[courses[node_id]]?.prereqs || [];

      return Array.from(
        new Set(
          prereqs
            // Make an edge for each prereq
            .map((prereq: string) => ({
              from: courses.indexOf(prereq),
              to: node_id,
            }))
            .concat(
              // Recursively compute prereqs of all prereqs
              prereqs
                .map((prereq: string) =>
                  getEdges(courses.indexOf(prereq), depth + 1)
                )
                .flat()
            )
            // Stringify and then unstringify after removing duplicates
            // because JavaScript compares objects by reference
            .map(JSON.stringify)
        )
        // @ts-expect-error: Parsing JSON is not type-safe
      ).map((json: string) => JSON.parse(json));
    }

    const edges = getEdges(0, 0);

    // Update node colors based on depths that were just computed
    for (let node of nodes) {
      node.color = this.color(node.depth);
      node.font.color = this.textColor(node.depth, node.color.background);
    }

    return { nodes: nodes, edges: edges };
  }
}
</script>
