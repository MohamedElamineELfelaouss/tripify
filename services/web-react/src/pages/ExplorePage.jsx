import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  StarIcon,
  HeartIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
  const [viewMode, setViewMode] = useState('grid')
  const [favorites, setFavorites] = useState(new Set())

  // Fetch destinations with filters
  const { data: destinations, isLoading, refetch } = useQuery({
    queryKey: ['destinations', searchQuery, selectedCategory],
    queryFn: () => apiService.getDestinations({
      search: searchQuery,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      limit: 50
    }),
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['destination-categories'],
    queryFn: () => apiService.getDestinationCategories(),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchQuery) {
      params.set('q', searchQuery)
    } else {
      params.delete('q')
    }
    setSearchParams(params)
    refetch()
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    const params = new URLSearchParams(searchParams)
    if (category !== 'all') {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    setSearchParams(params)
  }

  const toggleFavorite = (destinationId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(destinationId)) {
        newFavorites.delete(destinationId)
      } else {
        newFavorites.add(destinationId)
      }
      return newFavorites
    })
  }

  const defaultCategories = [
    { id: 'all', name: 'All Destinations', icon: '🌍' },
    { id: 'beach', name: 'Beaches', icon: '🏖️' },
    { id: 'mountain', name: 'Mountains', icon: '🏔️' },
    { id: 'city', name: 'Cities', icon: '🏙️' },
    { id: 'nature', name: 'Nature', icon: '🌲' },
    { id: 'culture', name: 'Culture', icon: '🏛️' },
    { id: 'adventure', name: 'Adventure', icon: '🎯' },
  ]

  const displayCategories = categories || defaultCategories

  // Mock destinations if API fails
  const mockDestinations = [
    {
      id: 1,
      name: 'Santorini, Greece',
      country: 'Greece',
      category: 'beach',
      rating: 4.8,
      reviews: 1250,
      price: 1200,
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Stunning white-washed buildings overlooking the Aegean Sea'
    },
    {
      id: 2,
      name: 'Kyoto, Japan',
      country: 'Japan',
      category: 'culture',
      rating: 4.9,
      reviews: 2100,
      price: 800,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Ancient temples and traditional gardens in Japan\'s cultural heart'
    },
    {
      id: 3,
      name: 'Swiss Alps',
      country: 'Switzerland',
      category: 'mountain',
      rating: 4.7,
      reviews: 890,
      price: 1500,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Breathtaking alpine scenery and world-class skiing'
    },
    {
      id: 4,
      name: 'Bali, Indonesia',
      country: 'Indonesia',
      category: 'nature',
      rating: 4.6,
      reviews: 1800,
      price: 600,
      image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Tropical paradise with rice terraces and ancient temples'
    },
    {
      id: 5,
      name: 'New York City',
      country: 'USA',
      category: 'city',
      rating: 4.5,
      reviews: 3200,
      price: 1000,
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'The city that never sleeps with iconic skyline and culture'
    },
    {
      id: 6,
      name: 'Patagonia',
      country: 'Argentina/Chile',
      category: 'adventure',
      rating: 4.8,
      reviews: 650,
      price: 1800,
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Rugged wilderness perfect for trekking and exploration'
    }
  ]

  const displayDestinations = destinations || mockDestinations

  // Filter destinations based on search and category
  const filteredDestinations = displayDestinations.filter(destination => {
    const matchesSearch = !searchQuery || 
      destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      destination.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || destination.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore Destinations</h1>
              <p className="text-gray-600 mt-1">Discover amazing places around the world</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FunnelIcon className="w-5 h-5 mr-2" />
                Categories
              </h3>
              
              <div className="space-y-2">
                {displayCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`w-full flex items-center p-3 rounded-lg text-left transition-colors duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="text-xl mr-3">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* View Controls */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredDestinations.length} destinations found
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <ViewColumnsIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" text="Loading destinations..." />
              </div>
            )}

            {/* Destinations Grid/List */}
            {!isLoading && (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-6'
              }>
                {filteredDestinations.map((destination) => (
                  <div
                    key={destination.id}
                    className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden group ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                          viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'
                        }`}
                      />
                      
                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(destination.id)}
                        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200"
                      >
                        {favorites.has(destination.id) ? (
                          <HeartSolidIcon className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-gray-600" />
                        )}
                      </button>

                      {/* Virtual Tour Badge */}
                      <div className="absolute bottom-3 left-3 flex items-center bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                        <CameraIcon className="w-3 h-3 mr-1" />
                        3D Tour
                      </div>
                    </div>

                    <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {destination.name}
                          </h3>
                          <p className="text-gray-600 flex items-center">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {destination.country}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center mb-1">
                            <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium ml-1">{destination.rating}</span>
                          </div>
                          <p className="text-xs text-gray-500">({destination.reviews} reviews)</p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {destination.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            ${destination.price}
                          </span>
                          <span className="text-gray-500 ml-1">/ person</span>
                        </div>
                        
                        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredDestinations.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No destinations found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSearchParams({})
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExplorePage
