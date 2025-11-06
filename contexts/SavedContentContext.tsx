
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { SavedItem } from '../types';

interface SavedContentContextType {
  savedItems: SavedItem[];
  saveItem: (item: Omit<SavedItem, 'id' | 'createdAt'>) => void;
  deleteItem: (id: string) => void;
}

const SavedContentContext = createContext<SavedContentContextType | undefined>(undefined);

export const SavedContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const item = window.localStorage.getItem('savedContent');
      return item ? JSON.parse(item) : [];
    } catch (error) {
      console.error("Could not parse saved content from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('savedContent', JSON.stringify(savedItems));
    } catch (error) {
      console.error("Could not save content to localStorage", error);
    }
  }, [savedItems]);

  const saveItem = (item: Omit<SavedItem, 'id' | 'createdAt'>) => {
    const newItem: SavedItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSavedItems(prevItems => [newItem, ...prevItems]);
  };

  const deleteItem = (id: string) => {
    setSavedItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  return (
    <SavedContentContext.Provider value={{ savedItems, saveItem, deleteItem }}>
      {children}
    </SavedContentContext.Provider>
  );
};

export const useSavedContent = (): SavedContentContextType => {
  const context = useContext(SavedContentContext);
  if (context === undefined) {
    throw new Error('useSavedContent must be used within a SavedContentProvider');
  }
  return context;
};
