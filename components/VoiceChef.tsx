
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Volume2, Info, Loader2, Sparkles } from 'lucide-react';

const VoiceChef: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('Ready to cook');

  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startAssistant = async () => {
    setIsConnecting(true);
    setStatus('Initializing AI Chef...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = outputContext.createGain();
      outputNodeRef.current.connect(outputContext.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            setStatus('Active');
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscript(prev => [...prev.slice(-4), `Chef: ${message.serverContent?.outputTranscription?.text}`]);
            }
            if (message.serverContent?.inputTranscription) {
              setTranscript(prev => [...prev.slice(-4), `You: ${message.serverContent?.inputTranscription?.text}`]);
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputContext);
              const source = outputContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current!);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setIsActive(false);
            setStatus('Disconnected');
          },
          onerror: (e) => {
            console.error(e);
            setStatus('Connection Error');
            setIsConnecting(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a friendly, Michelin-star level professional chef assistant. Help the user cook, give tips, explain techniques, and suggest ingredient swaps. Be concise and encouraging.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      setStatus('Microphone access denied');
    }
  };

  const stopAssistant = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    setIsActive(false);
    setStatus('Ready to cook');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] overflow-hidden border border-stone-200 shadow-2xl">
      <div className="p-8 bg-stone-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isActive ? 'bg-orange-500 animate-pulse' : 'bg-stone-800'}`}>
            <Mic size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Chef Assistant Live</h2>
            <p className="text-stone-400 text-sm flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-stone-600'}`} />
              {status}
            </p>
          </div>
        </div>
        <div className="bg-stone-800 p-2 rounded-xl text-stone-400">
          <Volume2 size={20} />
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-stone-50">
        {!isActive && !isConnecting && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-6">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <Sparkles size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Hands-free cooking</h3>
              <p className="text-stone-500">Ask your AI Chef about cooking times, substitutions, or step-by-step guidance while you work.</p>
            </div>
            <button 
              onClick={startAssistant}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-orange-200"
            >
              Start Voice Session
            </button>
          </div>
        )}

        {isConnecting && (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 size={48} className="animate-spin text-orange-500" />
            <p className="font-bold text-stone-600">Connecting to Lumina Chef...</p>
          </div>
        )}

        {isActive && (
          <div className="space-y-4">
            {transcript.map((line, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-2xl max-w-[85%] animate-in slide-in-from-bottom-2 ${
                  line.startsWith('Chef:') 
                  ? 'bg-white shadow-sm border border-stone-100' 
                  : 'bg-stone-800 text-white ml-auto'
                }`}
              >
                <p className="text-sm font-semibold mb-1 opacity-50">{line.split(':')[0]}</p>
                <p className="leading-relaxed">{line.split(':').slice(1).join(':')}</p>
              </div>
            ))}
            {transcript.length === 0 && (
              <div className="text-center py-20 text-stone-400 italic">
                Say "Hello Chef, how do I make a perfect omelette?"
              </div>
            )}
          </div>
        )}
      </div>

      {isActive && (
        <div className="p-8 border-t border-stone-100 flex items-center justify-center bg-white">
          <button 
            onClick={stopAssistant}
            className="group flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 bg-red-100 group-hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-all">
              <MicOff size={28} />
            </div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">End Session</span>
          </button>
        </div>
      )}

      <div className="px-8 py-4 bg-orange-50 border-t border-orange-100 flex items-center gap-3 text-orange-800 text-sm font-medium">
        <Info size={16} />
        <span>For best results, use headphones and a quiet environment.</span>
      </div>
    </div>
  );
};

export default VoiceChef;
