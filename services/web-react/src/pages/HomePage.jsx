import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  MapPinIcon, 
  GlobeAltIcon, 
  UserGroupIcon, 
  StarIcon,
  PlayIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const HomePage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Fetch featured destinations
  const { data: featuredDestinations, isLoading: loadingDestinations } = useQuery({
    queryKey: ['featured-destinations'],
    queryFn: () => apiService.getDestinations({ limit: 6, featured: true }),
  })

  // Fetch recent trips for inspiration
  const { data: recentTrips, isLoading: loadingTrips } = useQuery({
    queryKey: ['recent-trips'],
    queryFn: () => apiService.getTrips({ limit: 3, public: true }),
  })

  // Hero images carousel
  const heroImages = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages.length])

  const stats = [
    { icon: GlobeAltIcon, value: '150+', label: 'Countries' },
    { icon: UserGroupIcon, value: '50K+', label: 'Happy Travelers' },
    { icon: MapPinIcon, value: '1M+', label: 'Destinations' },
    { icon: StarIcon, value: '4.9', label: 'Average Rating' }
  ]

  const features = [
    {
      icon: MapPinIcon,
      title: 'Smart Trip Planning',
      description: 'AI-powered recommendations based on your preferences and budget',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CameraIcon,
      title: '3D Virtual Tours',
      description: 'Explore destinations in immersive 3D before you visit',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: CalendarDaysIcon,
      title: 'Real-time Booking',
      description: 'Book flights, hotels, and activities with live pricing',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Community Insights',
      description: 'Connect with fellow travelers and share experiences',
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Hero ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
            Discover Your Next
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Adventure
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in-up animation-delay-300">
            Plan, explore, and experience the world like never before with AI-powered travel insights
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
            <Link
              to="/explore"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start Exploring
              <ChevronRightIcon className="ml-2 w-5 h-5" />
            </Link>
            
            <button className="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/30">
              <PlayIcon className="mr-2 w-5 h-5" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Tripify?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of travel planning with our cutting-edge features designed to make your journey unforgettable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="p-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
                
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Destinations
            </h2>
            <p className="text-xl text-gray-600">
              Discover the world's most incredible places
            </p>
          </div>

          {loadingDestinations ? (
            <LoadingSpinner size="lg" text="Loading destinations..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredDestinations?.slice(0, 6).map((destination, index) => (
                <div
                  key={destination.id || index}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="aspect-w-16 aspect-h-12">
                    <img
                      src={destination.image || `https://images.unsplash.com/photo-${1500000000000 + index}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
                      alt={destination.name || `Destination ${index + 1}`}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">
                      {destination.name || `Amazing Destination ${index + 1}`}
                    </h3>
                    <p className="text-gray-200 mb-4">
                      {destination.description || 'Discover the beauty and culture of this incredible destination'}
                    </p>
                    <Link
                      to={`/explore?destination=${destination.id || index}`}
                      className="inline-flex items-center text-blue-300 hover:text-white transition-colors duration-200"
                    >
                      Explore Now
                      <ChevronRightIcon className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/explore"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              View All Destinations
              <ChevronRightIcon className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of travelers who trust Tripify to plan their perfect adventures
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/30"
            >
              Browse Destinations
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
