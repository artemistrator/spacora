'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder as FolderIcon, Plus, Edit, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSupabaseAuth } from '@/lib/auth';
import { Folder, getFoldersBySpaceId, createFolder, updateFolder, deleteFolder } from '@/lib/folder-utils';
import { FolderModal } from '@/components/space/FolderModal';

interface FolderListProps {
  spaceId: string;
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
}

export function FolderList({ spaceId, onFolderSelect, selectedFolderId }: FolderListProps) {
  console.log('FolderList rendered with spaceId:', spaceId);
  const { getSupabaseWithSession, userId } = useSupabaseAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log('FolderList useEffect triggered with spaceId:', spaceId);
    fetchFolders();
    checkOwnership();
  }, [spaceId, retryCount]);

  const fetchFolders = async () => {
    console.log('FolderList fetchFolders called with spaceId:', spaceId);
    setLoading(true);
    setError(null);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const fetchedFolders = await getFoldersBySpaceId(spaceId, supabaseClient);
      console.log('FolderList fetched folders:', fetchedFolders);
      setFolders(fetchedFolders);
    } catch (error: any) {
      console.error('Error fetching folders:', error);
      
      // Handle network errors specifically
      if (error.message === 'Failed to fetch' || error.message === 'Request timeout') {
        setError('Проблемы с подключением к серверу. Проверьте интернет-соединение.');
      } else {
        setError('Не удалось загрузить папки. Пожалуйста, попробуйте обновить страницу.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const checkOwnership = async () => {
    console.log('FolderList checkOwnership called with spaceId:', spaceId);
    try {
      const supabaseClient = await getSupabaseWithSession();
      const { data: spaceData, error } = await supabaseClient
        .from('spaces')
        .select('owner_id')
        .eq('id', spaceId)
        .maybeSingle();

      console.log('FolderList checkOwnership result:', { spaceData, error });
      if (spaceData && !error) {
        // You would need to get the current user ID here
        // For now, we'll assume the check is done elsewhere
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setShowModal(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setShowModal(true);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту папку?')) {
      return;
    }

    if (!userId) {
      alert('Пользователь не авторизован');
      return;
    }

    try {
      const supabaseClient = await getSupabaseWithSession();
      const success = await deleteFolder(folderId, userId, supabaseClient);
      if (success) {
        // If we're deleting the currently selected folder, clear the selection
        if (selectedFolderId === folderId && onFolderSelect) {
          onFolderSelect(null);
        }
        fetchFolders();
      } else {
        alert('Ошибка при удалении папки');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Ошибка при удалении папки');
    }
  };

  const handleFolderSubmit = async (folderData: Omit<Folder, 'id' | 'posts_count' | 'created_at' | 'updated_at' | 'space_id'>) => {
    if (!userId) {
      alert('Пользователь не авторизован');
      return;
    }

    try {
      const supabaseClient = await getSupabaseWithSession();
      let success = false;
      if (editingFolder) {
        // Update existing folder
        const updatedFolder = await updateFolder(editingFolder.id, folderData, userId, supabaseClient);
        success = !!updatedFolder;
      } else {
        // Create new folder
        const newFolder = await createFolder({ ...folderData, space_id: spaceId }, userId, supabaseClient);
        success = !!newFolder;
      }

      if (success) {
        setShowModal(false);
        fetchFolders();
      } else {
        alert('Ошибка при сохранении папки');
      }
    } catch (error) {
      console.error('Error saving folder:', error);
      alert('Ошибка при сохранении папки');
    }
  };

  if (loading) {
    return <div className="p-4">Загрузка папок...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
        <div className="flex items-center text-red-700">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span className="font-medium">Ошибка загрузки папок:</span>
        </div>
        <p className="text-red-600 text-sm mt-1 mb-3">{error}</p>
        <Button 
          onClick={handleRetry} 
          variant="outline" 
          size="sm" 
          className="flex items-center text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Папки</h2>
        <Button onClick={handleCreateFolder} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Создать папку
        </Button>
      </div>

      {folders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Нет папок</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">У вас пока нет папок в этом пространстве.</p>
            <Button onClick={handleCreateFolder} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Создать первую папку
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* All posts folder */}
          <Card 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              selectedFolderId === null ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onFolderSelect && onFolderSelect(null)}
          >
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderIcon className="h-5 w-5 mr-2" />
                Все посты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Все посты в этом пространстве</p>
            </CardContent>
          </Card>

          {folders.map((folder) => (
            <Card 
              key={folder.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow relative ${
                selectedFolderId === folder.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onFolderSelect && onFolderSelect(folder.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FolderIcon className="h-5 w-5 mr-2" />
                    {folder.name}
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFolder(folder);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{folder.description || 'Нет описания'}</p>
                <p className="text-xs text-gray-400 mt-2">Постов: {folder.posts_count || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <FolderModal
          folder={editingFolder}
          onClose={() => setShowModal(false)}
          onSubmit={handleFolderSubmit}
        />
      )}
    </div>
  );
}