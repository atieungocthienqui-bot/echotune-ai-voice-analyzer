import { PracticeRoom } from './components/PracticeRoom';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-white/10 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zm12-3c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">EchoTune</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Lịch sử</button>
            <button className="text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors">Đăng nhập</button>
          </div>
        </div>
      </nav>

      <main className="py-12">
        <PracticeRoom />
      </main>
    </div>
  );
}
