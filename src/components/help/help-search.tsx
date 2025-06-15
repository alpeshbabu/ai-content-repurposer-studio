'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

const helpTopics = [
  'Getting started with content repurposing',
  'Setting up your brand voice',
  'Understanding platform optimization',
  'Managing usage limits',
  'Upgrading your subscription plan',
  'Understanding overage charges',
  'Team collaboration features',
  'Troubleshooting content generation',
  'Managing payment methods',
  'Canceling your subscription',
  'API access and integrations',
  'Content analytics and insights',
  'Supported content types',
  'Platform-specific optimization',
];

export default function HelpSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simple search simulation - in a real app this would call an API
    setTimeout(() => {
      const results = helpTopics.filter(topic =>
        topic.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Search for help topics..."
          />
        </div>
      </form>

      {/* Search Results Dropdown */}
      {(searchQuery.trim() !== '' && (isSearching || searchResults.length > 0)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mx-auto"></div>
              <span className="mt-2 block">Searching...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => {
                    // In a real app, this would navigate to the specific help article
                    setSearchQuery(result);
                    setSearchResults([]);
                  }}
                >
                  <span className="text-gray-900">{result}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
} 