import TextReveal from '@/components/TextReveal'

export default function TestTextRevealPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#EAEAEA] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold mb-8">TextReveal Component Test</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#C5A065]">Basic Text Reveal</h2>
            <TextReveal text="Welcome to VeroTrade" className="text-3xl font-bold" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#C5A065]">With Custom Delay</h2>
            <TextReveal text="This text starts after 1 second" className="text-xl" delay={1} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#C5A065]">Metric Values</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0B0B0B] p-4 rounded-lg border border-[#1F1F1F]">
                <TextReveal text="$12,450" className="text-2xl font-bold text-[#2EBD85]" />
                <p className="text-sm text-gray-400 mt-2">Total Profit</p>
              </div>
              <div className="bg-[#0B0B0B] p-4 rounded-lg border border-[#1F1F1F]">
                <TextReveal text="87.3%" className="text-2xl font-bold text-[#C5A065]" />
                <p className="text-sm text-gray-400 mt-2">Win Rate</p>
              </div>
              <div className="bg-[#0B0B0B] p-4 rounded-lg border border-[#1F1F1F]">
                <TextReveal text="1:2.5" className="text-2xl font-bold text-[#E6D5B8]" />
                <p className="text-sm text-gray-400 mt-2">Risk/Reward</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#C5A065]">With Spaces</h2>
            <TextReveal text="Multiple words with spaces" className="text-lg" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-[#C5A065]">Longer Text</h2>
            <TextReveal text="This is a longer sentence to test the character-by-character reveal animation effect" className="text-base" />
          </div>
        </div>
      </div>
    </div>
  )
}