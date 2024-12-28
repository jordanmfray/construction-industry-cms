import React, { useState, useEffect } from 'react';

function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('Sending data to server:', formData);

      const response = await fetch('/api/companies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          websiteUrl: formData.websiteUrl
        }),
      });

      console.log('Response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);

      if (!response.ok) {
        const text = await response.text();
        console.log('Error response text:', text);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error;
        } catch (e) {
          errorMessage = text;
        }
        
        throw new Error(errorMessage || 'Failed to create company');
      }

      const data = await response.json();
      console.log('Success response:', data);

      // Reset form
      setFormData({
        name: '',
        websiteUrl: ''
      });

      // Refresh companies list
      await fetchCompanies();
    } catch (err) {
      console.error('Frontend error:', err);
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="container mx-auto p-4">Loading companies...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Company</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
              Website URL
            </label>
            <input
              type="url"
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Company'}
          </button>
          {submitError && (
            <p className="mt-2 text-sm text-red-600">{submitError}</p>
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
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">ID:</span> {company.Id}
                </p>
                {company.BusinessCity && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">City:</span> {company.BusinessCity}
                  </p>
                )}
                {company.BusinessState && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">State:</span> {company.BusinessState}
                  </p>
                )}
                {company.BusinessZip && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">ZIP Code:</span> {company.BusinessZip}
                  </p>
                )}
              </div>
              
              {company.Description && (
                <p className="text-gray-600 mb-4 text-sm italic">"{company.Description}"</p>
              )}
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
