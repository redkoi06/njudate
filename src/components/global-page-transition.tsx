"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type ReactNode,
} from "react";

type TransitionPhase = "idle" | "entering" | "exiting";

const ENTER_DURATION_MS = 160;
const EXIT_DURATION_MS = 260;
const ENTER_DURATION_REDUCED_MS = 90;
const EXIT_DURATION_REDUCED_MS = 140;
const FAILSAFE_DURATION_MS = 1400;
const ROUTE_CHECK_INTERVAL_MS = 100;

function clearTimer(timerRef: RefObject<number | null>) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

function buildRouteKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function getCurrentRouteKey() {
  return buildRouteKey(window.location.pathname, window.location.search);
}

export function GlobalPageTransition({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();
  const enterDuration = prefersReducedMotion
    ? ENTER_DURATION_REDUCED_MS
    : ENTER_DURATION_MS;
  const exitDuration = prefersReducedMotion
    ? EXIT_DURATION_REDUCED_MS
    : EXIT_DURATION_MS;

  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const phaseRef = useRef<TransitionPhase>("idle");
  const previousRouteRef = useRef<string | null>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const bypassSubmitFormRef = useRef<HTMLFormElement | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const failsafeTimerRef = useRef<number | null>(null);
  const phaseTimerRef = useRef<number | null>(null);
  const routeCheckTimerRef = useRef<number | null>(null);

  const schedulePhase = useCallback((nextPhase: TransitionPhase) => {
    clearTimer(phaseTimerRef);
    phaseTimerRef.current = window.setTimeout(() => {
      phaseTimerRef.current = null;
      setPhase(nextPhase);
    }, 0);
  }, []);

  const resetTransition = useCallback(() => {
    clearTimer(enterTimerRef);
    clearTimer(exitTimerRef);
    clearTimer(failsafeTimerRef);
    clearTimer(phaseTimerRef);
    clearTimer(routeCheckTimerRef);
    pendingNavigationRef.current = null;
    phaseRef.current = "idle";
    setPhase("idle");
  }, []);

  const startOverlay = useCallback((navigate?: () => void) => {
    if (phaseRef.current !== "idle") {
      return;
    }

    clearTimer(enterTimerRef);
    clearTimer(exitTimerRef);
    clearTimer(failsafeTimerRef);

    pendingNavigationRef.current = navigate ?? null;
    phaseRef.current = "entering";
    setPhase("entering");

    enterTimerRef.current = window.setTimeout(() => {
      pendingNavigationRef.current?.();
      pendingNavigationRef.current = null;
      enterTimerRef.current = null;
    }, enterDuration);

    failsafeTimerRef.current = window.setTimeout(() => {
      resetTransition();
    }, enterDuration + FAILSAFE_DURATION_MS);
  }, [enterDuration, resetTransition]);

  useEffect(() => {
    previousRouteRef.current = getCurrentRouteKey();
  }, []);

  useEffect(() => {
    if (phase !== "entering") {
      return;
    }

    const detectRouteChange = () => {
      const nextRouteKey = getCurrentRouteKey();

      if (previousRouteRef.current === nextRouteKey) {
        routeCheckTimerRef.current = window.setTimeout(
          detectRouteChange,
          ROUTE_CHECK_INTERVAL_MS,
        );
        return;
      }

      previousRouteRef.current = nextRouteKey;
      clearTimer(enterTimerRef);
      clearTimer(failsafeTimerRef);
      phaseRef.current = "exiting";
      schedulePhase("exiting");

      exitTimerRef.current = window.setTimeout(() => {
        resetTransition();
      }, exitDuration);
    };

    detectRouteChange();

    return () => {
      clearTimer(routeCheckTimerRef);
    };
  }, [exitDuration, phase, resetTransition, schedulePhase]);

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      if (anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      if (href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) {
        return;
      }

      const current = new URL(window.location.href);
      const destinationRoute = `${destination.pathname}${destination.search}`;
      const currentRoute = `${current.pathname}${current.search}`;

      if (destinationRoute === currentRoute) {
        return;
      }

      if (phaseRef.current !== "idle") {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      startOverlay(() => {
        startTransition(() => {
          router.push(`${destination.pathname}${destination.search}${destination.hash}`);
        });
      });
    };

    const onSubmitCapture = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLFormElement)) {
        return;
      }

      if (bypassSubmitFormRef.current === target) {
        bypassSubmitFormRef.current = null;
        return;
      }

      const submitter =
        event instanceof SubmitEvent ? event.submitter : null;
      const shouldAnimate =
        target.dataset.pageTransition === "route" ||
        submitter?.getAttribute("data-page-transition") === "route";

      if (!shouldAnimate || phaseRef.current !== "idle") {
        return;
      }

      event.preventDefault();
      startOverlay(() => {
        bypassSubmitFormRef.current = target;

        if (
          submitter instanceof HTMLButtonElement ||
          submitter instanceof HTMLInputElement
        ) {
          target.requestSubmit(submitter);
          return;
        }

        target.requestSubmit();
      });
    };

    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("submit", onSubmitCapture, true);

    return () => {
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("submit", onSubmitCapture, true);
    };
  }, [router, startOverlay]);

  useEffect(() => {
    return () => {
      clearTimer(enterTimerRef);
      clearTimer(exitTimerRef);
      clearTimer(failsafeTimerRef);
      clearTimer(phaseTimerRef);
      clearTimer(routeCheckTimerRef);
    };
  }, []);

  return (
    <>
      <div
        data-transition-phase={phase}
        className="page-transition-content"
        style={
          {
            "--page-transition-enter-duration": `${enterDuration}ms`,
            "--page-transition-exit-duration": `${exitDuration}ms`,
          } as CSSProperties
        }
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        data-transition-phase={phase}
        className="page-transition-overlay"
        style={
          {
            "--page-transition-enter-duration": `${enterDuration}ms`,
            "--page-transition-exit-duration": `${exitDuration}ms`,
          } as CSSProperties
        }
      />
    </>
  );
}
