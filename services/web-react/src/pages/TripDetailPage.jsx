import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { 
  MapPinIcon,
  CalendarDaysIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShareIcon,
  PencilIcon,
  StarIcon,
  PhotoIcon,
  MapIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const TripDetailPage = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch trip details
  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => apiService.getTrip(id),
  })

  // Mock trip data
  const mockTrip = {
    id: 1,
    title: 'Japan Adventure',
    destination: 'Tokyo, Kyoto, Osaka',
    startDate: '2024-03-15',
    endDate: '2024-03-25',
    status: 'upcoming',
    participants: 2,
    budget: 3500,
    spent: 1200,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    description: 'An incredible journey through Japan, exploring ancient temples, modern cities, and experiencing the unique culture.',
    days: [
      {
        date: '2024-03-15',
        location: 'Tokyo',
        activities: [
          { time: '09:00', title: 'Arrival at Narita Airport', type: 'transport' },
          { time: '12:00', title: 'Check-in at Hotel Shibuya', type: 'accommodation' },
          { time: '15:00', title: 'Visit Sensoji Temple', type: 'sightseeing' },
          { time: '18:00', title: 'Dinner in Shibuya', type: 'dining' }
        ]
      },
      {
        date: '2024-03-16',
        location: 'Tokyo',
        activities: [
          { time: '08:00', title: 'Breakfast at Tsukiji Market', type: 'dining' },
          { time: '10:00', title: 'Tokyo National Museum', type: 'sightseeing' },
          { time: '14:00', title: 'Shopping in Harajuku', type: 'shopping' },
          { time: '19:00', title: 'Traditional Izakaya Experience', type: 'dining' }
        ]
      }
    ],
    photos: [
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1528164344705-47542687000d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1590559899731-a382839e5549?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    ],
    expenses: [
      { category: 'Flights', amount: 800, budget: 1000 },
      { category: 'Accommodation', amount: 400, budget: 600 },
      { category: 'Food', amount: 300, budget: 500 },
      { category: 'Activities', amount: 200, budget: 400 },
      { category: 'Transport', amount: 100, budget: 200 }
    ]
  }

  const displayTrip = trip || mockTrip

  const getActivityIcon = (type) => {
    switch (type) {
      case 'transport': return '🚗'
      case 'accommodation': return '🏨'
      case 'sightseeing': return '📍'
      case 'dining': return '🍽️'
      case 'shopping': return '🛍️'
      default: return '📅'
    }
  }

  const getBudgetColor = (spent, budget) => {
    const percentage = (spent / budget) * 100
    if (percentage < 50) return 'text-green-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading trip details..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={displayTrip.image}
          alt={displayTrip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-2">{displayTrip.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-lg">
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  {displayTrip.destination}
                </div>
                <div className="flex items-center">
                  <CalendarDaysIcon className="w-5 h-5 mr-2" />
                  {new Date(displayTrip.startDate).toLocaleDateString()} - {new Date(displayTrip.endDate).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2" />
                  {displayTrip.participants} participant{displayTrip.participants !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button className="bg-white text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                <PencilIcon className="w-5 h-5 inline mr-2" />
                Edit Trip
              </button>
              <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors duration-200">
                <ShareIcon className="w-5 h-5 inline mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: ClockIcon },
                { id: 'itinerary', label: 'Itinerary', icon: MapIcon },
                { id: 'budget', label: 'Budget', icon: CurrencyDollarIcon },
                { id: 'photos', label: 'Photos', icon: PhotoIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Trip Description</h3>
                <p className="text-gray-600">{displayTrip.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Budget</p>
                      <p className="text-2xl font-bold text-blue-900">${displayTrip.budget?.toLocaleString()}</p>
                    </div>
                    <CurrencyDollarIcon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Amount Spent</p>
                      <p className="text-2xl font-bold text-green-900">${displayTrip.spent?.toLocaleString()}</p>
                    </div>
                    <StarIcon className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Remaining</p>
                      <p className="text-2xl font-bold text-purple-900">${(displayTrip.budget - displayTrip.spent)?.toLocaleString()}</p>
                    </div>
                    <ClockIcon className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'itinerary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Day by Day Itinerary</h3>
              
              {displayTrip.days?.map((day, dayIndex) => (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900">
                      Day {dayIndex + 1} - {day.location}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {day.activities.map((activity, activityIndex) => (
                      <div key={activityIndex} className="flex items-start space-x-3">
                        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900">{activity.title}</h5>
                            <span className="text-sm text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Budget Breakdown</h3>
              
              <div className="space-y-4">
                {displayTrip.expenses?.map((expense, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{expense.category}</h4>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${getBudgetColor(expense.amount, expense.budget)}`}>
                          ${expense.amount}
                        </span>
                        <span className="text-gray-500 ml-2">/ ${expense.budget}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (expense.amount / expense.budget) < 0.5 ? 'bg-green-500' :
                          (expense.amount / expense.budget) < 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((expense.amount / expense.budget) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Trip Photos</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayTrip.photos?.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Trip photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
                
                {/* Add Photo Button */}
                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors duration-200 cursor-pointer">
                  <div className="text-center">
                    <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Add Photo</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TripDetailPage
