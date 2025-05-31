import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  PlusIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const TripsPage = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tripToDelete, setTripToDelete] = useState(null)
  const queryClient = useQueryClient()

  // Fetch user trips
  const { data: trips, isLoading } = useQuery({
    queryKey: ['user-trips'],
    queryFn: () => apiService.getTrips(),
  })

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: (tripId) => apiService.deleteTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-trips'])
      setShowDeleteModal(false)
      setTripToDelete(null)
    }
  })

  // Mock trips if API fails
  const mockTrips = [
    {
      id: 1,
      title: 'Japan Adventure',
      destination: 'Tokyo, Kyoto, Osaka',
      startDate: '2024-03-15',
      endDate: '2024-03-25',
      status: 'upcoming',
      participants: 2,
      budget: 3500,
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Exploring the cultural wonders of Japan',
      activities: ['Temple visits', 'Food tours', 'Cherry blossom viewing']
    },
    {
      id: 2,
      title: 'European Summer',
      destination: 'Paris, Rome, Barcelona',
      startDate: '2024-06-10',
      endDate: '2024-06-20',
      status: 'planning',
      participants: 4,
      budget: 2800,
      image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'A grand tour of European capitals',
      activities: ['Museum visits', 'Wine tasting', 'Historical tours']
    },
    {
      id: 3,
      title: 'Bali Retreat',
      destination: 'Ubud, Canggu, Seminyak',
      startDate: '2023-12-01',
      endDate: '2023-12-10',
      status: 'completed',
      participants: 2,
      budget: 1200,
      image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      description: 'Relaxing wellness retreat in Bali',
      activities: ['Yoga sessions', 'Spa treatments', 'Beach time']
    }
  ]

  const displayTrips = trips || mockTrips

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800'
      case 'planning':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return <CalendarDaysIcon className="w-4 h-4" />
      case 'planning':
        return <ClockIcon className="w-4 h-4" />
      case 'completed':
        return <EyeIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const filteredTrips = displayTrips.filter(trip => {
    if (activeTab === 'all') return true
    return trip.status === activeTab
  })

  const tabs = [
    { id: 'all', label: 'All Trips', count: displayTrips.length },
    { id: 'planning', label: 'Planning', count: displayTrips.filter(t => t.status === 'planning').length },
    { id: 'upcoming', label: 'Upcoming', count: displayTrips.filter(t => t.status === 'upcoming').length },
    { id: 'completed', label: 'Completed', count: displayTrips.filter(t => t.status === 'completed').length }
  ]

  const handleDeleteTrip = (trip) => {
    setTripToDelete(trip)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteTripMutation.mutate(tripToDelete.id)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-1">Manage and track your travel adventures</p>
            </div>
            
            <Link
              to="/create-trip"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Trip
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading your trips..." />
          </div>
        )}

        {/* Trips Grid */}
        {!isLoading && (
          <>
            {filteredTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden group"
                  >
                    {/* Trip Image */}
                    <div className="relative">
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Status Badge */}
                      <div className={`absolute top-3 left-3 flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {getStatusIcon(trip.status)}
                        <span className="ml-1 capitalize">{trip.status}</span>
                      </div>

                      {/* Actions Menu */}
                      <div className="absolute top-3 right-3">
                        <div className="relative group/menu">
                          <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors duration-200">
                            <EllipsisVerticalIcon className="w-4 h-4 text-gray-600" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                            <Link
                              to={`/trips/${trip.id}/edit`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <PencilIcon className="w-4 h-4 mr-2" />
                              Edit Trip
                            </Link>
                            <button
                              onClick={() => {/* Share logic */}}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <ShareIcon className="w-4 h-4 mr-2" />
                              Share Trip
                            </button>
                            <button
                              onClick={() => handleDeleteTrip(trip)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4 mr-2" />
                              Delete Trip
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                        {trip.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4">
                        {trip.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{trip.destination}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-sm">
                          <CalendarDaysIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>
                            {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-600 text-sm">
                          <UsersIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{trip.participants} participant{trip.participants !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {trip.activities?.slice(0, 2).map((activity, index) => (
                            <span
                              key={index}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                            >
                              {activity}
                            </span>
                          ))}
                          {trip.activities?.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              +{trip.activities.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            ${trip.budget?.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">budget</span>
                        </div>
                        
                        <Link
                          to={`/trips/${trip.id}`}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPinIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'all' ? 'No trips yet' : `No ${activeTab} trips`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'all' 
                    ? "Start planning your first adventure and create unforgettable memories."
                    : `You don't have any ${activeTab} trips at the moment.`
                  }
                </p>
                <Link
                  to="/create-trip"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First Trip
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Trip
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{tripToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTripMutation.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                {deleteTripMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TripsPage
