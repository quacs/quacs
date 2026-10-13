<template>
  <section
    v-if="place === 'bottom'"
    class="sk-shelf"
    aria-label="Your courses, on the bookshelf"
  >
    <div class="sk-books">
      <router-link
        v-for="book in books"
        :key="book.key"
        :to="book.to"
        class="sk-book"
        :class="{ 'sk-book-light': book.light }"
        :style="book.style"
        :title="book.tip"
      >
        <span class="sk-book-title">{{ book.title }}</span>
        <span class="sk-book-code">{{ book.code }}</span>
      </router-link>
    </div>
    <div class="sk-plank">
      <span class="sk-plate">{{ label }}</span>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Department } from "@/typings";

interface Book {
  key: string;
  code: string;
  title: string;
  tip: string;
  to: string;
  light: boolean;
  style: { [property: string]: string };
}

// Book cloth, by department: [cover, whether the cover is light enough to need dark lettering]
const CLOTHS: [string, boolean][] = [
  ["#7a2c25", false], // oxblood
  ["#24395c", false], // navy
  ["#2e5134", false], // forest
  ["#6b4a1f", false], // tobacco
  ["#1f5a63", false], // teal
  ["#57385d", false], // plum
  ["#8a3b20", false], // rust
  ["#3f4a57", false], // slate
  ["#c49a3a", true], // mustard
  ["#d8ccae", true], // natural linen
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return h;
}

// iBooks' wooden shelf, above the footer, holding the courses in the current course set as
// cloth-bound books. Each book opens its course; with no courses, the shelf holds the QuACS handbook.
@Component
export default class SkeuomorphismDecor extends Vue {
  @Prop({ required: true }) readonly place!: string;

  get selectedCrns(): Set<number> {
    const schedule = this.$store.state.schedule;
    const set = schedule.courseSets[schedule.currentTerm]?.[
      schedule.currentCourseSet
    ] as { [crn: string]: boolean } | undefined;
    return new Set(
      set
        ? Object.keys(set)
            .filter((crn) => set[crn])
            .map(Number)
        : []
    );
  }

  get label(): string {
    return this.$store.state.schedule.currentCourseSet;
  }

  get books(): Book[] {
    const selected = this.selectedCrns;
    const books: Book[] = [];
    if (selected.size > 0) {
      for (const dept of this.$store.state.departments as Department[]) {
        for (const course of dept.courses) {
          if (course.sections.some((section) => selected.has(section.crn))) {
            books.push(
              this.book(
                `${course.subj}-${course.crse}`,
                course.title,
                course.subj
              )
            );
          }
        }
      }
    }
    if (books.length === 0) {
      // An empty shelf holds the handbook, bound in QuACS gold
      const handbook = this.book("QUACS-101", "The QuACS Handbook", "QUACS");
      return [
        {
          ...handbook,
          to: "/",
          tip: "Add courses to your schedule and they'll stand on this shelf",
          light: true,
          style: { ...handbook.style, "--sk-cover": "#f0ad1c" },
        },
      ];
    }
    return books.sort((a, b) => a.code.localeCompare(b.code));
  }

  book(code: string, title: string, subj: string): Book {
    const [cover, light] = CLOTHS[hash(subj) % CLOTHS.length];
    // Books on a real shelf are never quite the same size
    const size = hash(code);
    return {
      key: `${code} ${title}`,
      code: code.replace("-", " "),
      title,
      tip: `${code.replace("-", " ")}: ${title}`,
      to: `/search?${encodeURIComponent(code)}`,
      light,
      style: {
        "--sk-cover": cover,
        "--sk-w": `${80 + (size % 3) * 6}px`,
        "--sk-h": `${108 + ((size >> 3) % 4) * 5}px`,
      },
    };
  }
}
</script>

<style>
/* The page is a flex column, where auto margins would shrink the shelf to its books, so it takes
the full width (up to the content's) and centers itself */
.sk-shelf {
  width: 100%;
  max-width: 1170px;
  margin: 2.6rem auto 2.4rem;
  padding: 0 1rem;
}

/* The books stand on the plank's top, so they overlap it a little. A shelf with more books than
fit scrolls sideways. --sk-k scales the books down on phones. */
.sk-books {
  --sk-k: 1;

  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: -7px;
  padding: 12px 28px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

/* Brass bookends hold the row. Their auto margins center it, and give way to the start when the
shelf scrolls, so the first book is never cut off. */
.sk-books::before,
.sk-books::after {
  content: "";
  flex: none;
  width: calc(10px * var(--sk-k));
  height: calc(78px * var(--sk-k));
  border-radius: 5px 5px 1px 1px;
  background: linear-gradient(
    90deg,
    #6b4a14,
    #f2d68e 35%,
    #c79b45 55%,
    #7a5418
  );
  box-shadow: 2px 3px 5px rgb(0 0 0 / 55%), inset 0 1px 0 rgb(255 248 220 / 60%);
}

.sk-books::before {
  margin-left: auto;
}

.sk-books::after {
  margin-right: auto;
}

/* A cloth-bound hardcover: the hinge groove near the spine, light across the cloth, the weave, and
the title stamped in gold between two rules */
.sk-book {
  --sk-cover: #7a2c25;
  --sk-foil: #ecd59a;

  position: relative;
  display: flex;
  flex: none;
  width: calc(var(--sk-w, 84px) * var(--sk-k));
  height: calc(var(--sk-h, 112px) * var(--sk-k));
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 11px 6px 8px 12px;
  border-radius: 2px 4px 4px 2px;
  background: linear-gradient(
      90deg,
      rgb(0 0 0 / 40%) 0 2px,
      rgb(255 255 255 / 16%) 2px 4px,
      rgb(0 0 0 / 0%) 4px 7px,
      rgb(0 0 0 / 28%) 7px 8px,
      rgb(255 255 255 / 12%) 8px 9px,
      rgb(0 0 0 / 0%) 9px
    ),
    linear-gradient(
      110deg,
      rgb(255 255 255 / 18%),
      rgb(255 255 255 / 0%) 45%,
      rgb(0 0 0 / 22%)
    ),
    repeating-linear-gradient(
      0deg,
      rgb(0 0 0 / 7%) 0 1px,
      rgb(0 0 0 / 0%) 1px 3px
    ),
    repeating-linear-gradient(
      90deg,
      rgb(255 255 255 / 6%) 0 1px,
      rgb(0 0 0 / 0%) 1px 3px
    ),
    var(--sk-cover);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 28%),
    inset 0 1px 0 rgb(255 255 255 / 14%), 3px 4px 7px rgb(0 0 0 / 50%);
  color: var(--sk-foil);
  text-align: center;
  text-decoration: none;
}

.sk-book:hover,
.sk-book:focus-visible {
  color: #fff3c9;
  text-decoration: none;
  transform: translateY(-5px);
}

.sk-book-light {
  --sk-foil: #3a2a12;
}

.sk-book-light:hover,
.sk-book-light:focus-visible {
  color: #000;
}

.sk-book-title {
  display: -webkit-box;
  flex: none;
  overflow: hidden;
  padding: 4px 0;
  border-top: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  font-family: baskerville, "Libre Baskerville", "Book Antiqua", georgia, serif;
  font-size: calc(10.5px * var(--sk-k));
  font-weight: 700;
  line-height: 1.22;
  text-shadow: 0 1px 0 rgb(0 0 0 / 45%);
  overflow-wrap: break-word;
  hyphens: auto;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.sk-book-light .sk-book-title,
.sk-book-light .sk-book-code {
  text-shadow: 0 1px 0 rgb(255 255 255 / 35%);
}

.sk-book-code {
  font-family: "Helvetica Neue", helvetica, arimo, arial, sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 0 rgb(0 0 0 / 45%);
}

/* The plank: its top lit from above, then the rounded front edge, darker toward the bottom */
.sk-plank {
  position: relative;
  height: 27px;
  border-radius: 3px;
  background: linear-gradient(
      180deg,
      rgb(255 236 200 / 32%) 0,
      rgb(255 236 200 / 10%) 9px,
      rgb(255 228 188 / 45%) 9px 10px,
      rgb(0 0 0 / 0%) 12px,
      rgb(0 0 0 / 34%) 100%
    ),
    url("../../assets/images/skeuomorphism/wood.jpg") 0 0 / 256px 80px, #a06a3c;
  box-shadow: 0 1px 0 rgb(0 0 0 / 45%), 0 14px 14px -6px rgb(0 0 0 / 65%);
}

/* A brass label holder on the front edge, with the course set's name written on its card */
.sk-plate {
  position: absolute;
  top: 11px;
  left: 50%;
  max-width: calc(100% - 2rem);
  overflow: hidden;
  padding: 0 9px;
  border: 2px solid #b48a3c;
  border-radius: 2px;
  background: linear-gradient(180deg, #fbf7ea, #ede5cf);
  box-shadow: inset 0 1px 1px rgb(0 0 0 / 25%), 0 1px 1px rgb(0 0 0 / 45%);
  color: #33291a;
  font-family: noteworthy, "Marker Felt", "Patrick Hand", "Segoe Print",
    "Bradley Hand", cursive;
  font-size: 12px;
  line-height: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  transform: translateX(-50%);
}

@media (prefers-reduced-motion: no-preference) {
  .sk-book {
    transition: transform 0.15s ease;
  }
}

@media (max-width: 575.98px) {
  .sk-books {
    --sk-k: 0.86;

    gap: 10px;
    padding: 12px 14px 0;
  }
}
</style>
