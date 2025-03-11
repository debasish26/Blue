import { Share2, Twitter, Facebook, Send } from 'lucide-react';

export function Footer() {
  const shareCount = "568k";
  
  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Join us in saving everyone from natural disasters! #BLUE #DisasterPreparedness");
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://telegram.me/share/url?url=${url}&text=${text}`, '_blank');
        break;
      case 'reddit':
        window.open(`https://reddit.com/submit?url=${url}&title=${text}`, '_blank');
        break;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-blue-500/20 py-4 px-8">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-blue-200 text-xl font-semibold">Save Everyone</h2>
          <span className="text-gray-400 text-sm">{shareCount} Shares</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Telegram Share */}
          <button
            onClick={() => handleShare('telegram')}
            className="flex items-center gap-2 bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#2AABEE] px-6 py-2 rounded-full transition-all"
          >
            <Send size={20} />
            <span>Share</span>
          </button>

          {/* Twitter Share */}
          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center gap-2 bg-black/30 hover:bg-black/40 text-white px-6 py-2 rounded-full transition-all"
          >
            <Twitter size={20} />
            <span>Tweet</span>
          </button>

          {/* Facebook Share */}
          <button
            onClick={() => handleShare('facebook')}
            className="flex items-center gap-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] px-6 py-2 rounded-full transition-all"
          >
            <Facebook size={20} />
            <span>Share</span>
          </button>

          {/* Reddit Share */}
          <button
            onClick={() => handleShare('reddit')}
            className="flex items-center gap-2 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 text-[#FF4500] px-6 py-2 rounded-full transition-all"
          >
            <Share2 size={20} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}