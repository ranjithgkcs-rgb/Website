
import React, { useState, useEffect } from 'react';
import { ChefHat, Search, Utensils, Zap, Camera, Mic, Play, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { Recipe } from './types';
import { generateRecipeFromIngredients, searchRecipes, analyzeFridgeImage, generateFoodImage } from './services/gemini';
import RecipeCard from './components/RecipeCard';
import VoiceChef from './components/VoiceChef';
import IngredientInput from './components/IngredientInput';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'fridge' | 'assistant'>('home');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{text: string; sources: any[]} | null>(null);

  const handleGenerateRecipe = async (ingredients: string[]) => {
    setLoading(true);
    try {
      const newRecipe = await generateRecipeFromIngredients(ingredients);
      const imageUrl = await generateFoodImage(newRecipe.title);
      newRecipe.image = imageUrl;
      setRecipes([newRecipe, ...recipes]);
      setActiveTab('home');
    } catch (error) {
      console.error("Failed to generate recipe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const result = await searchRecipes(searchQuery);
      setSearchResult(result);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const items = await analyzeFridgeImage(base64);
        await handleGenerateRecipe(items);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image analysis failed:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 md:pt-16">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 rounded-lg text-white">
            <ChefHat size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-800">Lumina Kitchen</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => setActiveTab('home')} className={`font-medium transition-colors ${activeTab === 'home' ? 'text-orange-600' : 'text-stone-500 hover:text-stone-800'}`}>Explore</button>
          <button onClick={() => setActiveTab('search')} className={`font-medium transition-colors ${activeTab === 'search' ? 'text-orange-600' : 'text-stone-500 hover:text-stone-800'}`}>Search</button>
          <button onClick={() => setActiveTab('fridge')} className={`font-medium transition-colors ${activeTab === 'fridge' ? 'text-orange-600' : 'text-stone-500 hover:text-stone-800'}`}>My Fridge</button>
          <button onClick={() => setActiveTab('assistant')} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-orange-200">
            <Mic size={18} />
            Talk to Chef
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 mt-16">
        {activeTab === 'home' && (
          <div className="space-y-12">
            <section className="relative overflow-hidden rounded-3xl bg-stone-900 text-white p-8 md:p-16">
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 grayscale pointer-events-none">
                <img src="https://picsum.photos/seed/food1/800/800" alt="Food background" className="object-cover w-full h-full" />
              </div>
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Cook something <span className="text-orange-400">extraordinary</span> today.</h1>
                <p className="text-lg md:text-xl text-stone-300 mb-8 leading-relaxed">Let our AI Chef help you find the perfect recipe based on what you already have in your kitchen.</p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => setActiveTab('fridge')} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all">
                    Start AI Cooking <ArrowRight size={20} />
                  </button>
                  <button onClick={() => setActiveTab('assistant')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all">
                    Voice Assistant <Mic size={20} />
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Your Recipes</h2>
                {loading && <Loader2 className="animate-spin text-orange-500" />}
              </div>
              
              {recipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white border-2 border-dashed border-stone-200 rounded-3xl">
                  <Utensils size={48} className="mx-auto text-stone-300 mb-4" />
                  <p className="text-stone-500 text-lg">No recipes generated yet. Use the "My Fridge" tab to start!</p>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Global Culinary Search</h2>
            <div className="flex gap-2 mb-8 p-1.5 bg-white shadow-xl rounded-2xl border border-stone-100">
              <input 
                type="text" 
                placeholder="Search for dishes, cuisines, or ingredients..." 
                className="flex-1 px-4 py-3 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
              />
              <button 
                onClick={handleGlobalSearch}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-3 rounded-xl transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search size={24} />}
              </button>
            </div>

            {searchResult && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="prose prose-stone max-w-none">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{searchResult.text}</p>
                </div>
                {searchResult.sources.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-stone-100">
                    <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">Sources & Citations</h3>
                    <div className="flex flex-wrap gap-3">
                      {searchResult.sources.map((chunk, idx) => (
                        chunk.web && (
                          <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-full text-sm text-stone-600 transition-colors">
                            {chunk.web.title || 'Visit Link'} <ExternalLink size={14} />
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'fridge' && (
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">What's in your kitchen?</h2>
              <p className="text-stone-500 text-lg">Input your ingredients manually or snap a photo of your fridge.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center text-center">
                <div className="bg-orange-100 p-4 rounded-full text-orange-600 mb-6">
                  <Camera size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Scan Your Fridge</h3>
                <p className="text-stone-500 text-sm mb-6">Our AI will detect ingredients and suggest recipes instantly.</p>
                <label className="w-full">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="bg-stone-100 hover:bg-stone-200 cursor-pointer text-stone-800 py-3 rounded-xl font-medium transition-colors">
                    Upload Photo
                  </div>
                </label>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center text-center">
                <div className="bg-green-100 p-4 rounded-full text-green-600 mb-6">
                  <Utensils size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Manual Input</h3>
                <p className="text-stone-500 text-sm mb-6">Type in the ingredients you want to use.</p>
                <button 
                  onClick={() => setActiveTab('fridge')} // Stay on fridge for input
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Type Ingredients
                </button>
              </div>
            </div>

            <IngredientInput onGenerate={handleGenerateRecipe} isLoading={loading} />
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="max-w-4xl mx-auto h-[70vh]">
            <VoiceChef />
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex justify-around items-center h-16 md:hidden z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-orange-500' : 'text-stone-400'}`}>
          <Utensils size={20} />
          <span className="text-[10px] font-medium uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setActiveTab('search')} className={`flex flex-col items-center gap-1 ${activeTab === 'search' ? 'text-orange-500' : 'text-stone-400'}`}>
          <Search size={20} />
          <span className="text-[10px] font-medium uppercase tracking-widest">Search</span>
        </button>
        <button onClick={() => setActiveTab('fridge')} className={`flex flex-col items-center gap-1 ${activeTab === 'fridge' ? 'text-orange-500' : 'text-stone-400'}`}>
          <Zap size={20} />
          <span className="text-[10px] font-medium uppercase tracking-widest">AI Kitchen</span>
        </button>
        <button onClick={() => setActiveTab('assistant')} className={`flex flex-col items-center gap-1 ${activeTab === 'assistant' ? 'text-orange-500' : 'text-stone-400'}`}>
          <Mic size={20} />
          <span className="text-[10px] font-medium uppercase tracking-widest">Assistant</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
