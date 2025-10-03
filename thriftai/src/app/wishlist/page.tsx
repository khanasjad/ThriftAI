'use client'

import React, { useState } from 'react'
import { Heart, Folder, Plus, X, Grid, List, Share2, ShoppingCart } from 'lucide-react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useSession } from 'next-auth/react'

interface WishlistItem {
  id: string
  productId: string
  title: string
  brand: string
  price: number
  image: string
  addedDate: string
  folderId?: string
}

interface WishlistFolder {
  id: string
  name: string
  itemCount: number
  color: string
}

export default function WishlistPage() {
  const { data: session } = useSession()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const appUser = session?.user ? {
    id: session.user.id || '',
    email: session.user.email || '',
    firstName: session.user.firstName || session.user.name || '',
    lastName: session.user.lastName || '',
    userType: 'buyer' as const
  } : null

  // Mock data
  const [folders, setFolders] = useState<WishlistFolder[]>([
    { id: '1', name: 'Favorites', itemCount: 8, color: 'red' },
    { id: '2', name: 'Gift Ideas', itemCount: 5, color: 'blue' },
    { id: '3', name: 'Watch Later', itemCount: 12, color: 'purple' },
  ])

  const [items, setItems] = useState<WishlistItem[]>([
    {
      id: '1',
      productId: 'prod-1',
      title: 'Vintage Leather Jacket',
      brand: 'Classic Style',
      price: 89.99,
      image: '/api/placeholder/400/400',
      addedDate: '2 days ago',
      folderId: '1'
    },
    // Add more mock items...
  ])

  const createFolder = () => {
    if (newFolderName.trim()) {
      const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink']
      setFolders([...folders, {
        id: Date.now().toString(),
        name: newFolderName,
        itemCount: 0,
        color: colors[Math.floor(Math.random() * colors.length)]
      }])
      setNewFolderName('')
      setShowNewFolder(false)
    }
  }

  const getFolderColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'from-red-900/20 to-red-800/10 border-red-500/30',
      blue: 'from-blue-900/20 to-blue-800/10 border-blue-500/30',
      green: 'from-green-900/20 to-green-800/10 border-green-500/30',
      purple: 'from-purple-900/20 to-purple-800/10 border-purple-500/30',
      orange: 'from-orange-900/20 to-orange-800/10 border-orange-500/30',
      pink: 'from-pink-900/20 to-pink-800/10 border-pink-500/30',
    }
    return colors[color] || colors.red
  }

  const filteredItems = selectedFolder
    ? items.filter(item => item.folderId === selectedFolder)
    : items

  return (
    <div className="App">
      <Navigation
        user={appUser}
        onShowLogin={() => {}}
        onShowSignup={() => {}}
        onLogout={() => {}}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            My Wishlist
          </h1>
          <p className="text-[var(--text-secondary)]">Save items you love and organize them into folders</p>
        </div>

        {/* Folders */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Folders
            </h2>
            <button
              onClick={() => setShowNewFolder(true)}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Folder
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`bg-gradient-to-br ${!selectedFolder ? 'from-gray-700 to-gray-800 border-gray-500' : 'from-gray-900/20 to-gray-800/10 border-gray-500/30'} border rounded-xl p-4 text-left transition-all`}
            >
              <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{items.length}</div>
              <div className="text-sm text-[var(--text-secondary)]">All Items</div>
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`bg-gradient-to-br ${selectedFolder === folder.id ? getFolderColor(folder.color).replace('/20', '') : getFolderColor(folder.color)} border rounded-xl p-4 text-left transition-all`}
              >
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{folder.itemCount}</div>
                <div className="text-sm text-[var(--text-secondary)]">{folder.name}</div>
              </button>
            ))}
          </div>

          {/* New Folder Dialog */}
          {showNewFolder && (
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg p-4 flex gap-3">
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                className="flex-1 px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                autoFocus
              />
              <button
                onClick={createFolder}
                className="px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors font-medium"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewFolder(false)}
                className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-[var(--text-secondary)]">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No items yet</h3>
            <p className="text-[var(--text-secondary)]">Start adding items to your wishlist!</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl overflow-hidden group ${viewMode === 'list' ? 'flex' : ''}`}
              >
                <div className={`relative ${viewMode === 'list' ? 'w-32 h-32' : 'aspect-square'}`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setItems(items.filter(i => i.id !== item.id))}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex items-center justify-between' : ''}`}>
                  <div className={viewMode === 'list' ? 'flex-1' : ''}>
                    <div className="text-xs text-[var(--text-secondary)] mb-1">{item.brand}</div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-2 line-clamp-2">{item.title}</h3>
                    <div className="text-lg font-bold text-[var(--accent-primary)] mb-2">${item.price.toFixed(2)}</div>
                    <div className="text-xs text-[var(--text-secondary)]">Added {item.addedDate}</div>
                  </div>
                  <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-col' : 'mt-3'}`}>
                    <button className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors text-sm font-medium flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      {viewMode === 'grid' ? 'Add to Cart' : ''}
                    </button>
                    <button className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors text-sm flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      {viewMode === 'grid' ? 'Share' : ''}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
