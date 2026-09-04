import { ref, onMounted, onUnmounted } from "vue";

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  text: string;
  background: string;
  border: string;
}

const FALLBACKS: ThemeColors = {
  primary: "#0ea5e9",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  text: "#0f172a",
  background: "#ffffff",
  border: "#e5e7eb",
};

const THEME_ATTRIBUTES = [
  "data-theme",
  "data-palette",
  "data-primary",
  "data-neutral",
  "data-radius",
  "data-font",
];

function readColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * Resolves vd3 `--vd-*` tokens into concrete color strings suitable for
 * Canvas 2D (which does not understand `var(--...)`). Re-reads on theme
 * attribute changes so canvases repaint in the active light/dark palette.
 */
export function useThemeColors() {
  const colors = ref<ThemeColors>({ ...FALLBACKS });

  function refresh(): void {
    colors.value = {
      primary: readColor("--vd-color-primary", FALLBACKS.primary),
      secondary: readColor("--vd-color-secondary", FALLBACKS.secondary),
      success: readColor("--vd-color-success", FALLBACKS.success),
      warning: readColor("--vd-color-warning", FALLBACKS.warning),
      danger: readColor("--vd-color-danger", FALLBACKS.danger),
      text: readColor("--vd-text-primary", FALLBACKS.text),
      background: readColor("--vd-bg-primary", FALLBACKS.background),
      border: readColor("--vd-border-color", FALLBACKS.border),
    };
  }

  let observer: MutationObserver | null = null;

  onMounted(() => {
    refresh();
    observer = new MutationObserver(() => refresh());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: THEME_ATTRIBUTES,
    });
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return { colors, refresh };
}
