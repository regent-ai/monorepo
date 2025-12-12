import { MoonIcon, SunIcon } from "lucide-react";
import { flushSync } from "react-dom";

import { useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";

function getResolvedTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getMaxRadius(x: number, y: number) {
  const { innerWidth, innerHeight } = window;
  return Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
}

export function ThemeToggle() {
  const { setTheme } = useTheme();

  function toggleTheme(event: React.MouseEvent<HTMLButtonElement>) {
    const resolvedTheme = getResolvedTheme();
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canUseViewTransition =
      typeof document !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (document as any).startViewTransition === "function" &&
      !prefersReducedMotion;

    if (!canUseViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const radius = getMaxRadius(x, y);

    const root = document.documentElement;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transition = (document as any).startViewTransition(() => {
      // Apply the theme class synchronously so the view transition captures it.
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);

      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.ready
      .then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${radius}px at ${x}px ${y}px)`,
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const common: any = { duration: 520, easing: "ease-in-out" };

        // Animate the incoming snapshot expanding from the click point.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root as any).animate(
          { clipPath },
          { ...common, pseudoElement: "::view-transition-new(root)" }
        );

        // Animate the outgoing snapshot shrinking back to the click point.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root as any).animate(
          { clipPath: [...clipPath].reverse() },
          { ...common, pseudoElement: "::view-transition-old(root)" }
        );
      })
      .catch(() => {
        // If the transition fails for any reason, fall back silently.
      });
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
