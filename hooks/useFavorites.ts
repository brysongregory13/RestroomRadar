import { useState, useEffect } from 'react';
import { subscribeFavoriteIds, addFavorite, removeFavorite } from '../services/favoritesService';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    return subscribeFavoriteIds(user.uid, setFavoriteIds);
  }, [user?.uid]);

  async function toggleFavorite(restroomId: string) {
    if (!user) return false;
    if (favoriteIds.has(restroomId)) {
      await removeFavorite(user.uid, restroomId);
    } else {
      await addFavorite(user.uid, restroomId);
    }
    return true;
  }

  return { favoriteIds, toggleFavorite, isLoggedIn: !!user };
}
