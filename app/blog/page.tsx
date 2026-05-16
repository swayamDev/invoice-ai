import Link from 'next/link'
import { RiArrowLeftLine, RiArrowRightLine } from 'react-icons/ri'

export const metadata = { title: 'Blog · Invoice AI' }

const posts = [
  { title: 'How to Get Paid Faster as a Freelancer', date: 'May 5, 2026', tag: 'Tips' },
  { title: 'Introducing AI-Powered Invoice Generation', date: 'Apr 28, 2026', tag: 'Product' },
  { title: 'The Future of B2B Payments in 2026', date: 'Apr 15, 2026', tag: 'Industry' },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#050505] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-12 transition-colors">
          <RiArrowLeftLine className="w-4 h-4" /> Back home
        </Link>
        <h1 className="font-serif text-4xl font-bold text-white mb-2">Blog</h1>
        <p className="text-white/40 text-base mb-12">Insights, product updates, and invoicing tips.</p>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.title} className="block bg-[#0a0a0a] border border-white/8 hover:border-[#FF0A54]/25 rounded-xl p-6 transition-colors group cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-[#FF0A54] bg-[#FF0A54]/10 px-2 py-0.5 rounded mb-3 inline-block">{post.tag}</span>
                  <h2 className="font-serif text-lg font-bold text-white group-hover:text-[#FF0A54] transition-colors">{post.title}</h2>
                  <p className="text-white/30 text-sm mt-2">{post.date}</p>
                </div>
                <RiArrowRightLine className="w-5 h-5 text-white/20 group-hover:text-[#FF0A54] mt-1 flex-shrink-0 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
