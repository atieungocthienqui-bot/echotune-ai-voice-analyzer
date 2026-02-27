import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Play, Activity, RefreshCw, Music } from 'lucide-react';
import { AudioService } from '../services/audioService';
import { WaveformVisualizer } from './WaveformVisualizer';
import { PitchCurveVisualizer } from './PitchCurveVisualizer';
import { calculateMockScore, VocalMetrics } from '../services/mockScoring';
import { getVocalFeedback, transcribeAudio, searchSongByLyrics } from '../services/geminiService';
import { motion } from 'motion/react';

export const PracticeRoom: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [pitchData, setPitchData] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<VocalMetrics | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const [transcribedLyrics, setTranscribedLyrics] = useState<string | null>(null);
  const [guessedSong, setGuessedSong] = useState<string | null>(null);
  const [guessStatus, setGuessStatus] = useState<'idle' | 'transcribing' | 'searching' | 'done'>('idle');
  
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const audioServiceRef = useRef<AudioService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    audioServiceRef.current = new AudioService();
    return () => {
      audioServiceRef.current?.stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStartRecording = async () => {
    try {
      setMetrics(null);
      setFeedback(null);
      setGuessedSong(null);
      setTranscribedLyrics(null);
      setGuessStatus('idle');
      setPitchData([]);
      setRecordingDuration(0);

      await audioServiceRef.current?.startRecording((data) => {
        setAudioData(new Uint8Array(data));
        
        // Mock pitch extraction: just use a random value based on the audio data average
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const mockPitch = avg > 128 ? (avg - 128) * 10 + 200 : 0; // Simple mock logic
        
        setPitchData(prev => {
          const newData = [...prev, mockPitch];
          if (newData.length > 200) newData.shift(); // Keep last 200 points
          return newData;
        });
      });

      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert("Không thể truy cập micro. Vui lòng kiểm tra quyền.");
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const audioResult = await audioServiceRef.current?.stopRecording();

    // Calculate score
    const result = calculateMockScore(recordingDuration);
    setMetrics(result);

    // Save to localStorage
    const history = JSON.parse(localStorage.getItem('echotune_history') || '[]');
    history.push({ date: new Date().toISOString(), metrics: result });
    localStorage.setItem('echotune_history', JSON.stringify(history));

    // Get AI Feedback
    setIsLoadingFeedback(true);
    getVocalFeedback(result).then(aiFeedback => {
      setFeedback(aiFeedback);
      setIsLoadingFeedback(false);
    });

    // Guess Song via Lyrics
    if (audioResult && recordingDuration > 2) {
      setGuessStatus('transcribing');
      try {
        const base64Audio = await blobToBase64(audioResult.blob);
        const lyrics = await transcribeAudio(base64Audio, audioResult.mimeType);
        setTranscribedLyrics(lyrics);

        if (lyrics && !lyrics.includes("Không nhận diện được lời")) {
          setGuessStatus('searching');
          const songGuess = await searchSongByLyrics(lyrics);
          setGuessedSong(songGuess);
        } else {
          setGuessedSong("Chỉ có tiếng ngân nga hoặc âm thanh không rõ, không thể tìm qua lời.");
        }
      } catch (e) {
        console.error(e);
        setGuessedSong("Đã xảy ra lỗi trong quá trình nhận diện.");
      } finally {
        setGuessStatus('done');
      }
    } else if (recordingDuration <= 2) {
      setGuessStatus('done');
      setGuessedSong("Đoạn ghi âm quá ngắn để nhận diện bài hát.");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Phòng Tập Hát</h1>
        <p className="text-zinc-400">Hát hoặc ngân nga để AI phân tích giọng hát của bạn</p>
      </header>

      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl space-y-6">
        
        {/* Visualizers */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Waveform (Âm lượng)</h3>
              <span className="text-xs font-mono text-zinc-500">{formatTime(recordingDuration)}</span>
            </div>
            <WaveformVisualizer data={audioData} width={800} height={120} />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Pitch Curve (Cao độ)</h3>
            <PitchCurveVisualizer pitchData={pitchData} width={800} height={120} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4 py-4">
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Mic className="w-5 h-5" />
              Bắt đầu thu
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium transition-colors shadow-lg shadow-red-500/20 animate-pulse"
            >
              <Square className="w-5 h-5" />
              Dừng thu
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      {metrics && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Metrics Card */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Chỉ số kỹ thuật
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-end gap-4 border-b border-zinc-800 pb-4">
                <div className="text-5xl font-bold text-white">{metrics.score}</div>
                <div className="text-zinc-400 mb-1">/ 100 Điểm tổng</div>
              </div>

              <div className="space-y-4">
                <MetricBar label="Nhịp điệu (Rhythm)" value={metrics.rhythm} color="bg-blue-500" />
                <MetricBar label="Độ ổn định (Stability)" value={metrics.stability} color="bg-purple-500" />
                <MetricBar label="Độ rung (Vibrato)" value={metrics.vibrato} color="bg-amber-500" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Song Guessing Card */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Music className={`w-5 h-5 text-cyan-400 ${guessStatus === 'transcribing' || guessStatus === 'searching' ? 'animate-pulse' : ''}`} />
                Nhận diện bài hát qua lời
              </h3>
              
              <div className="space-y-3">
                {/* Lyrics Section */}
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Lời nghe được</div>
                  {guessStatus === 'transcribing' ? (
                    <div className="flex items-center text-zinc-400 gap-3">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang bóc băng ghi âm...</span>
                    </div>
                  ) : (
                    <p className="text-zinc-300 italic">
                      {transcribedLyrics && !transcribedLyrics.includes("Không nhận diện được lời") 
                        ? `"${transcribedLyrics}"` 
                        : "Không có dữ liệu lời bài hát."}
                    </p>
                  )}
                </div>

                {/* Result Section */}
                <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50">
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Kết quả tìm kiếm</div>
                  {guessStatus === 'searching' ? (
                    <div className="flex items-center text-zinc-400 gap-3">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang tra cứu bài hát...</span>
                    </div>
                  ) : (
                    <p className="text-emerald-400 font-medium">
                      {guessedSong || "Chưa có kết quả."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* AI Feedback Card */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 text-indigo-400 ${isLoadingFeedback ? 'animate-spin' : ''}`} />
                AI Huấn luyện viên
              </h3>
              
              <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50 max-h-64 overflow-y-auto">
                {isLoadingFeedback ? (
                  <div className="flex items-center justify-center h-20 text-zinc-500 space-x-2">
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const MetricBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-zinc-400">{label}</span>
      <span className="text-white font-medium">{value}%</span>
    </div>
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full ${color}`} 
      />
    </div>
  </div>
);
