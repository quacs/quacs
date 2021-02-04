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
    const nodes = Array.from(courses.entries()).map(([id, course]) => ({
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
    }

    return { nodes: nodes, edges: edges };
  }
}
</script>
