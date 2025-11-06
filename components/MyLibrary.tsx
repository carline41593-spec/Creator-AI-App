import React, { useState } from 'react';
import { useSavedContent } from '../contexts/SavedContentContext';
import { SavedItem } from '../types';
import { Icon } from './common/Icon';

const SavedItemCard: React.FC<{ item: SavedItem }> = ({ item }) => {
    const { deleteItem } = useSavedContent();
    const [copied, setCopied] = useState(false);

    const handleDownload = async () => {
        const link = document.createElement('a');
        let href = item.content;

        if (item.type === 'text') {
            const blob = new Blob([item.content], { type: 'text/plain' });
            href = URL.createObjectURL(blob);
        }
        
        link.href = href;

        const extension = { image: 'jpeg', video: 'mp4', text: 'txt' }[item.type];
        link.download = `creator-ai-${item.type}-${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (item.type === 'text') {
            URL.revokeObjectURL(href);
        }
    };
    
    const handleCopy = () => {
        if(item.type !== 'text') return;
        navigator.clipboard.writeText(item.content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col">
            {item.type === 'image' && <img src={item.content} alt={item.prompt} className="w-full h-48 object-cover"/>}
            {item.type === 'video' && <video src={item.content} controls className="w-full h-48 object-cover"/>}
            {item.type === 'text' && (
                 <div className="p-4 h-48 overflow-y-auto">
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{item.content}</p>
                 </div>
            )}
            <div className="p-4 bg-gray-800/50 flex-grow flex flex-col justify-between">
                <div>
                    <p className="text-xs text-gray-500 mb-2">
                        {new Date(item.createdAt).toLocaleString()} | <span className="font-semibold">{item.type.toUpperCase()}</span>
                    </p>
                    <p className="text-sm text-gray-400 line-clamp-2" title={item.prompt}>
                        <strong>Prompt:</strong> {item.prompt}
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-700">
                    <button onClick={handleDownload} title="Download" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"><Icon name="download" className="w-5 h-5"/></button>
                    {item.type === 'text' && <button onClick={handleCopy} title="Copy Text" className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"><Icon name="copy" className="w-5 h-5"/></button>}
                    <div className="flex-grow"></div>
                    {copied && <span className="text-xs text-green-400">Copied!</span>}
                    <button onClick={() => deleteItem(item.id)} title="Delete" className="p-2 text-red-500 hover:text-red-400 hover:bg-gray-700 rounded-full transition"><Icon name="trash" className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    )
}


export const MyLibrary: React.FC = () => {
    const { savedItems } = useSavedContent();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = savedItems.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            item.prompt.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query)
        );
    });

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-red-400">My Library</h2>
            <p className="mb-6 text-gray-400">
                Here are all your saved creations. You can download, copy, or delete them at any time.
            </p>

            {savedItems.length > 0 && (
                 <div className="mb-8 max-w-lg mx-auto">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by prompt or type (image, video, text)..."
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                    />
                </div>
            )}

            {savedItems.length === 0 ? (
                <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
                    <Icon name="library" className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white">Your Library is Empty</h3>
                    <p className="text-gray-400 mt-2">
                        Start creating images, videos, or text content, and save them to see them here!
                    </p>
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => <SavedItemCard key={item.id} item={item}/>)}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
                     <h3 className="text-xl font-semibold text-white">No Results Found</h3>
                    <p className="text-gray-400 mt-2">
                        No saved items match your search for "{searchQuery}".
                    </p>
                </div>
            )}
        </div>
    );
};