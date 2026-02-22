import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      expanded: true
    },
    backgrounds: {
      default: "royal-night",
      values: [
        { name: "royal-night", value: "#07080b" },
        { name: "obsidian", value: "#0f1115" },
        { name: "parchment", value: "#efe5c3" }
      ]
    },
    nextjs: {
      appDirectory: true
    }
  }
};

export default preview;
