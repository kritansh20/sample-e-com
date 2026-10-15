import { useState, useContext, createContext, ReactNode } from 'react';

export const MAX_COMPARE = 3;
const STORAGE_KEY = 'compareProductIds';

interface CompareContextType {
  ids: string[];
  isComparing: (productId: string) => boolean;
  toggle: (productId: string) => { ok: boolean; message?: string };
  remove: (productId: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const readIds = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
};

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ids, setIds] = useState<string[]>(readIds);

  const save = (next: string[]) => {
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const value: CompareContextType = {
    ids,
    isComparing: (productId) => ids.includes(productId),
    toggle: (productId) => {
      if (ids.includes(productId)) {
        save(ids.filter(id => id !== productId));
        return { ok: true };
      }
      if (ids.length >= MAX_COMPARE) {
        return { ok: false, message: `You can compare up to ${MAX_COMPARE} products. Remove one to add another.` };
      }
      save([...ids, productId]);
      return { ok: true };
    },
    remove: (productId) => save(ids.filter(id => id !== productId)),
    clear: () => save([]),
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

export const useCompare = (): CompareContextType => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
