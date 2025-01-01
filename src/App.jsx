import React, { useState, useEffect } from 'react';

function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchData, setSearchData] = useState({
    location: '',
    companyType: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/companies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error;
        } catch (e) {
          errorMessage = text;
        }
        throw new Error(errorMessage || 'Search failed');
      }

      const data = await response.json();
      console.log('Search results:', data);

      if (data.success) {
        // Update companies list with search results
        setCompanies(data.companies);
        setSearchError(null);
      } else {
        setSearchError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="container mx-auto p-4">Loading companies...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Search Companies</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location (e.g., "Denver, CO")
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={searchData.location}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="companyType" className="block text-sm font-medium text-gray-700">
              Company Type (e.g., "plumbing")
            </label>
            <input
              type="text"
              id="companyType"
              name="companyType"
              value={searchData.companyType}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSearching ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSearching ? 'Searching...' : 'Search Companies'}
          </button>
          {searchError && (
            <p className="mt-2 text-sm text-red-600">{searchError}</p>
          )}
        </form>
      </div>

      <h1 className="text-3xl font-bold mb-6">Companies</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.Id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2 text-gray-800">{company.Name}</h2>
              
              <div className="space-y-2 mb-4">
                {company.AddressStreet && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Address:</span> {company.AddressStreet}
                  </p>
                )}
                {company.AddressCity && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">City:</span> {company.AddressCity}
                  </p>
                )}
                {company.AddressState && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">State:</span> {company.AddressState}
                  </p>
                )}
                {company.AddressZip && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">ZIP:</span> {company.AddressZip}
                  </p>
                )}
                {company.Rating && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Rating:</span> {company.Rating}
                  </p>
                )}
              </div>
              
              {company.WebsiteUrl && (
                <a 
                  href={company.WebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
