import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top whenever the user navigates to a new page.
 * If the link targets a section on the page (a #hash), it scrolls there instead.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      // Give the new page a moment to render before looking for the section.
      const timer = window.setTimeout(() => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        window.scrollTo(0, 0);
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
