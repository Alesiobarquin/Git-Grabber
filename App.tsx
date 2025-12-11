import React, { useState, useCallback } from 'react';
import { fetchAllContributions } from './services/githubService';
import { ContributionItem } from './types';

// Components defined within file to avoid creating too many small files
// Input Component
interface InputFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, placeholder, type = "text", required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <input
      type={type}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

const App: React.FC = () => {
  // State for Inputs
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [username, setUsername] = useState('');
  const [branchInput, setBranchInput] = useState('');
  const [date, setDate] = useState('2023-08-01'); // Default to a typical semester start
  const [token, setToken] = useState('');

  // State for Processing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);

  const handleFetch = useCallback(async () => {
    if (!owner || !repo || !username || !date) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    setContributions([]);

    // Parse branch input: split by comma, trim whitespace, remove empty strings
    const branches = branchInput
      .split(',')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    try {
      const data = await fetchAllContributions({
        owner,
        repo,
        username,
        since: date,
        branches: branches.length > 0 ? branches : undefined,
        token: token || undefined
      });
      setContributions(data);
      if (data.length === 0) {
        setError("No contributions found matching criteria. Check your inputs.");
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, [owner, repo, username, branchInput, date, token]);

  // Derived state for the text area
  const linksText = contributions.map(c => c.url).join('\n');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header matching the red theme of the slides */}
      <header className="bg-red-700 text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Git Grabber</h1>
            <p className="text-red-100 text-sm mt-1">Final Contribution Collector</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-red-200">Keep your graders HAPPY!</p>
            <p className="text-xs text-red-200 font-mono">TEST ALL YOUR LINKS</p>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Configuration</h2>
            
            <InputField 
              label="Repository Owner" 
              placeholder="e.g. wdturner" 
              value={owner} 
              onChange={setOwner} 
              required 
            />
            <InputField 
              label="Repository Name" 
              placeholder="e.g. unk" 
              value={repo} 
              onChange={setRepo} 
              required 
            />
            <InputField 
              label="Branch Names (Optional, comma-separated)" 
              placeholder="e.g. main, dev, feature-x" 
              value={branchInput} 
              onChange={setBranchInput} 
            />
            <InputField 
              label="Your GitHub Username" 
              placeholder="e.g. wdturner" 
              value={username} 
              onChange={setUsername} 
              required 
            />
            <InputField 
              label="Start Date (YYYY-MM-DD)" 
              type="date"
              value={date} 
              onChange={setDate} 
              required 
            />
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <InputField 
                label="GitHub Token (Optional)" 
                placeholder="ghp_..." 
                type="password"
                value={token} 
                onChange={setToken} 
              />
              <p className="text-xs text-gray-500 mt-[-10px]">
                Recommended if you have many commits to avoid API rate limits.
              </p>
            </div>

            <button
              onClick={handleFetch}
              disabled={loading}
              className={`w-full mt-6 py-3 px-4 rounded-md text-white font-bold shadow-sm transition-all
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 active:scale-95'
                }`}
            >
              {loading ? 'Fetching from GitHub...' : 'Find Contributions'}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {contributions.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Found Stats</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between">
                  <span>Commits:</span>
                  <span className="font-mono font-bold">{contributions.filter(c => c.type === 'COMMIT').length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Pull Requests:</span>
                  <span className="font-mono font-bold">{contributions.filter(c => c.type === 'PR').length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Issues:</span>
                  <span className="font-mono font-bold">{contributions.filter(c => c.type === 'ISSUE').length}</span>
                </li>
                <li className="pt-2 mt-2 border-t flex justify-between font-bold text-gray-800">
                  <span>Total Links:</span>
                  <span>{contributions.length}</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: The Links List */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Contribution Links
                <span className="text-xs font-normal text-gray-500 ml-2">(One per line, exact format)</span>
              </h2>
              <button 
                onClick={() => copyToClipboard(linksText)}
                disabled={contributions.length === 0}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
            
            <div className="relative flex-grow">
              {contributions.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200 rounded">
                  <p>No contributions loaded yet.</p>
                </div>
              ) : (
                <textarea
                  readOnly
                  className="w-full h-full p-4 font-mono text-sm border-2 border-gray-300 rounded focus:border-red-500 focus:ring-0 resize-none text-gray-800 leading-relaxed"
                  value={linksText}
                />
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500 italic">
              * Verify these links work before submitting. Use a bulk URL opener if needed.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;