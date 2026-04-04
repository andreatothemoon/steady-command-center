import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const ALL_TOGGLEABLE_PAGES = [
  { key: "accounts", label: "Accounts", path: "/accounts" },
  { key: "contributions", label: "Contributions", path: "/contributions" },
  { key: "documents", label: "Documents", path: "/documents" },
  { key: "tax", label: "Tax", path: "/tax" },
  { key: "retirement", label: "Retirement", path: "/retirement" },
  { key: "db-pensions", label: "DB Pensions", path: "/db-pensions" },
] as const;

export type ToggleablePageKey = (typeof ALL_TOGGLEABLE_PAGES)[number]["key"];

interface PageVisibilityContextType {
  hiddenPages: Set<ToggleablePageKey>;
  togglePage: (key: ToggleablePageKey) => void;
  isPageVisible: (key: ToggleablePageKey) => boolean;
}

const STORAGE_KEY = "wealthos_hidden_pages";

const PageVisibilityContext = createContext<PageVisibilityContextType>({
  hiddenPages: new Set(),
  togglePage: () => {},
  isPageVisible: () => true,
});

export const usePageVisibility = () => useContext(PageVisibilityContext);
export { ALL_TOGGLEABLE_PAGES };

export function PageVisibilityProvider({ children }: { children: ReactNode }) {
  const [hiddenPages, setHiddenPages] = useState<Set<ToggleablePageKey>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenPages]));
  }, [hiddenPages]);

  const togglePage = (key: ToggleablePageKey) => {
    setHiddenPages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isPageVisible = (key: ToggleablePageKey) => !hiddenPages.has(key);

  return (
    <PageVisibilityContext.Provider value={{ hiddenPages, togglePage, isPageVisible }}>
      {children}
    </PageVisibilityContext.Provider>
  );
}
