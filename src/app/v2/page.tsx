export default function V2Page() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0D0D0E] text-white">
            <div className="text-center space-y-4">
                <div className="text-6xl font-black tracking-tighter text-white/10">V2</div>
                <h1 className="text-2xl font-black text-white tracking-tight">FluxX Desktop</h1>
                <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Coming Soon</p>
                <a
                    href="/v2/m"
                    className="inline-block mt-4 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white/60 hover:bg-white/10 transition-all"
                >
                    모바일 버전으로 이동 →
                </a>
            </div>
        </div>
    );
}
