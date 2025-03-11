import React, { useState } from 'react';
import { Search, Upload } from 'lucide-react';

interface SearchBarProps {
    onSearch: (location: string) => void;
    onImageUpload?: (file: File) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onImageUpload }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log(`🔍 Search triggered for: ${searchQuery.trim()}`);
            onSearch(searchQuery.trim());
            setSearchQuery(''); // Clear input after search
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onImageUpload) {
            onImageUpload(file);
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search location or ask about weather..."
                        className="w-full bg-gray-700/50 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="relative">
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                    <label
                        htmlFor="file-upload"
                        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg cursor-pointer"
                    >
                        <Upload className="w-5 h-5" />
                        <span>Upload Image</span>
                    </label>
                </div>
            </form>
        </div>
    );
};

export default SearchBar;   
