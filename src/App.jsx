import { useEffect, useRef, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import noctisThumb from './assets/noctisthumb.png';
import orebiThumb from './assets/orebithumb.png';
import nitroThumb from './assets/nitrothumb.png';
import anshThumb from './assets/anshthumb.png';
import francesThumb from './assets/francesthumb.png';
import ahmetThumb from './assets/ahmetthumb.png';

// ── Import PNG frames via Vite eager glob ────────────────────────────
const frameModules = import.meta.glob(
  './assets/ezgif-315d7a68291b5ac6-png-split/*.png',
  { eager: true, import: 'default' }
);

// Sort numerically so frames are strictly chronological
const frameUrls = Object.entries(frameModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => url);

const TOTAL_FRAMES = frameUrls.length;

// ── Tuning constants ─────────────────────────────────────────────────
const BASE_LERP      = 0.18;  // Base interpolation speed
const SNAP_THRESH    = 0.01;  // Snap to target below this delta
const VELOCITY_BOOST = 2.5;   // Max lerp multiplier for fast scrolls
const VELOCITY_SCALE = 3.0;   // Frame-delta that triggers full boost
const PREFETCH_RANGE = 8;     // Pre-decode ±N frames around current
// ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  'HOME',
  'ABOUT',
  'SERVICE',
  'SKILLS',
  'PROJECTS',
  'CLIENTS',
  'CONTACT',
];

const SERVICES = [
  {
    title: 'Frontend Development',
    description: 'Modern, responsive websites built with React and modern frontend technologies.',
  },
  {
    title: 'React Applications',
    description: 'Interactive web experiences with reusable components, routing, state management, and API integration.',
  },
  {
    title: 'Figma to Website',
    description: 'Turning designs into responsive, pixel-accurate, production-ready interfaces.',
  },
  {
    title: 'Responsive Design',
    description: 'Websites that adapt smoothly across mobile, tablet, and desktop.',
  },
  {
    title: 'Interactive Experiences',
    description: 'Smooth animations, transitions, and micro-interactions that make websites feel polished.',
  },
];

const SKILLS = [
  { name: 'HTML5' },
  { name: 'CSS3' },
  { name: 'JavaScript' },
  { name: 'React.js' },
  { name: 'Tailwind CSS' },
  { name: 'Redux Toolkit' },
  { name: 'React Router' },
  { name: 'REST APIs' },
  { name: 'Git' },
  { name: 'GitHub' },
  { name: 'Next.js' },
  { name: 'Node.js', isLearning: true },
  { name: 'MongoDB', isLearning: true },
];

const PROJECTS = [
  {
    title: 'Noctis Perfumes',
    thumbnail: noctisThumb,
    liveUrl: 'https://noctisperfumes.vercel.app/',
    githubUrl: 'https://github.com/enticodes/noctisPerfumes',
  },
  {
    title: 'Orebi Shop',
    thumbnail: orebiThumb,
    liveUrl: 'https://orebi-web-r.vercel.app/',
    githubUrl: 'https://github.com/enticodes/orebiWebR',
  },
  {
    title: 'Nitro Energy Drinks',
    thumbnail: nitroThumb,
    liveUrl: 'https://energydrink-three.vercel.app/',
    githubUrl: 'https://github.com/enticodes/energyDrink',
  },
];

const CLIENTS = [
  {
    name: 'Ansh Pandey',
    photo: anshThumb,
    rating: 5,
    preview:
      '“Working with Entisar was an amazing experience. He took the vision I had in mind and translated it into an actual website far better than I could have imagined...”',
    fullReview: `Working with Entisar was an amazing experience. He took the vision I had in mind and translated it into an actual website far better than I could have imagined. What I particularly appreciated was that he didn’t just stick to my initial ideas—he brought in his own suggestions and improvements that made the overall work even better.

His attention to detail, willingness to understand exactly what I wanted, and focus on making sure everything worked smoothly made the entire process effortless and enjoyable. The final outcome exceeded my expectations, and I’d definitely recommend him to anyone looking for someone who can turn an idea into something genuinely impressive.

— Ansh Pandey`,
  },
  {
    name: 'Frances M',
    photo: francesThumb,
    rating: 5,
    preview:
      '“He did such a fantastic job with my website! Very professional and attentive to what I wanted...”',
    fullReview: `“He did such a fantastic job with my website! Very professional and attentive to what I wanted. Very happy with the final website!”

— Frances M`,
  },
  {
    name: 'Ahmet Yildiz',
    photo: ahmetThumb,
    rating: 4,
    preview:
      '“Really happy with the website! The design looks great and everything feels smooth and professional...”',
    fullReview: `“Really happy with the website! The design looks great and everything feels smooth and professional. Great work overall.”

— Ahmet Yildiz`,
  },
];

function StarRating({ rating = 5 }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          fill={star <= rating ? '#F59E0B' : '#4B5563'}
          className="w-4 h-4 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ClientCard({ client }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group perspective-1200 h-[500px] w-full cursor-pointer select-none"
      onClick={() => setIsFlipped((prev) => !prev)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Review by ${client.name}. Click or hover to flip.`}
    >
      <div
        className={`flip-card-inner relative w-full h-full preserve-3d transition-transform duration-700 ease-out ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ── Front Face ── */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/10 group-hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-hover:shadow-[0_16px_48px_rgba(255,255,255,0.08)] transition-all duration-500 p-7 sm:p-8 flex flex-col justify-between overflow-hidden">
          {/* Subtle decorative radial blur */}
          <div className="absolute -top-16 -left-16 w-36 h-36 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />

          {/* Top: Profile photo, Name, Rating */}
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="relative mb-4">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-b from-white/30 via-white/10 to-transparent shadow-[0_0_24px_rgba(255,255,255,0.08)]">
                <div className="w-full h-full rounded-full overflow-hidden bg-black/60 border border-white/20">
                  <img
                    src={client.photo}
                    alt={client.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {client.name}
            </h3>

            <div className="mt-2.5">
              <StarRating rating={client.rating} />
            </div>
          </div>

          {/* Center: Quote Preview */}
          <div className="relative z-10 my-auto text-center px-2 py-4">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-7 h-7 text-white/20 mx-auto mb-3"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-sm sm:text-base font-normal text-white/80 leading-relaxed italic line-clamp-4">
              {client.preview}
            </p>
          </div>

          {/* Bottom Hint Pill */}
          <div className="relative z-10 flex justify-center pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] group-hover:bg-white/[0.12] border border-white/10 group-hover:border-white/20 text-xs font-semibold text-white/70 group-hover:text-white transition-all duration-300 shadow-sm">
              <span>Hover for full review</span>
              <span className="text-xs transition-transform duration-500 group-hover:rotate-180">↻</span>
            </div>
          </div>
        </div>

        {/* ── Back Face (Full Review) ── */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl bg-[#090910]/95 hover:bg-[#0c0c16]/95 backdrop-blur-2xl border border-white/15 group-hover:border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)] group-hover:shadow-[0_16px_48px_rgba(255,255,255,0.08)] transition-all duration-500 p-6 sm:p-7 flex flex-col justify-between overflow-hidden">
          {/* Top Mini Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-black/50 shrink-0">
                <img
                  src={client.photo}
                  alt={client.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white leading-none">
                  {client.name}
                </h4>
                <div className="mt-1">
                  <StarRating rating={client.rating} />
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-semibold">
              Full Review
            </span>
          </div>

          {/* Full Review Body with smooth custom scrollbar */}
          <div className="card-scrollbar overflow-y-auto pr-1 my-3 text-left leading-relaxed text-xs sm:text-[13px] text-white/90 space-y-3 font-normal">
            {client.fullReview.split('\n\n').map((paragraph, idx) => (
              <p
                key={idx}
                className={
                  paragraph.startsWith('—')
                    ? 'font-semibold text-white/75 italic text-right pt-1'
                    : ''
                }
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Bottom Flip Back Hint */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/50 shrink-0">
            <span className="font-mono text-[11px] tracking-wider text-white/40">
              Verified Client
            </span>
            <div className="inline-flex items-center gap-1.5 text-white/60 group-hover:text-white transition-colors">
              <span className="text-xs font-medium">Flip back</span>
              <span className="text-xs">↺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'
  const [copiedType, setCopiedType] = useState(null); // 'email' | 'phone' | null

  const handleCopy = (text, type, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;

    setStatus('sending');
    setTimeout(() => {
      setStatus('sent');
    }, 700);
  };

  return (
    <section
      id="contact"
      className="w-full py-24 sm:py-32 px-6 sm:px-12 md:px-16 lg:px-20 relative pointer-events-auto"
    >
      <div className="w-full max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] select-none">
            Contact
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/70 mt-3 max-w-xl font-medium leading-relaxed">
            Have a project in mind, an opportunity to discuss, or just want to connect? Reach out anytime.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">

          {/* Left Column: Direct Contact Info & Socials */}
          <div className="lg:col-span-5 flex flex-col gap-5 sm:gap-6">

            {/* Email Card (Glassmorphism) */}
            <div className="group relative rounded-3xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/10 hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.06)] transition-all duration-300 p-5 sm:p-6 flex items-center justify-between gap-4">
              <a
                href="mailto:lokha.com@gmail.com"
                className="flex items-center gap-4 min-w-0 flex-1"
                aria-label="Send email to lokha.com@gmail.com"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 group-hover:bg-white/20 transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block font-semibold">
                    Email
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white group-hover:text-white/95 truncate block transition-colors">
                    lokha.com@gmail.com
                  </span>
                </div>
              </a>

              <button
                type="button"
                onClick={(e) => handleCopy('lokha.com@gmail.com', 'email', e)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all text-xs shrink-0 cursor-pointer"
                title="Copy email address"
              >
                {copiedType === 'email' ? (
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">✓ Copied</span>
                ) : (
                  <span className="text-xs font-medium flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy
                  </span>
                )}
              </button>
            </div>

            {/* Phone Card (Glassmorphism) */}
            <div className="group relative rounded-3xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/10 hover:border-white/25 shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.06)] transition-all duration-300 p-5 sm:p-6 flex items-center justify-between gap-4">
              <a
                href="tel:+8801758494374"
                className="flex items-center gap-4 min-w-0 flex-1"
                aria-label="Call +8801758494374"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 group-hover:bg-white/20 transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block font-semibold">
                    Phone / WhatsApp
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white group-hover:text-white/95 truncate block transition-colors">
                    +8801758494374
                  </span>
                </div>
              </a>

              <button
                type="button"
                onClick={(e) => handleCopy('+8801758494374', 'phone', e)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-all text-xs shrink-0 cursor-pointer"
                title="Copy phone number"
              >
                {copiedType === 'phone' ? (
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">✓ Copied</span>
                ) : (
                  <span className="text-xs font-medium flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy
                  </span>
                )}
              </button>
            </div>

            {/* Social Icons Card (Glassmorphism) */}
            <div className="rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-6">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50 block mb-4 font-semibold">
                Social Connect
              </span>
              <div className="grid grid-cols-3 gap-3">
                {/* Discord */}
                <a
                  href="https://discord.com/users/1081204723509633036"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc flex flex-col items-center justify-center gap-2.5 py-4 px-3 rounded-2xl bg-white/[0.04] hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 shadow-md hover:shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all duration-300 hover:scale-105"
                  title="Connect on Discord"
                >
                  <div className="text-white/80 group-hover/soc:text-[#5865F2] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-white/80 group-hover/soc:text-white transition-colors">
                    Discord
                  </span>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc flex flex-col items-center justify-center gap-2.5 py-4 px-3 rounded-2xl bg-white/[0.04] hover:bg-sky-600/20 border border-white/10 hover:border-sky-500/40 shadow-md hover:shadow-[0_0_20px_rgba(14,118,168,0.3)] transition-all duration-300 hover:scale-105"
                  title="LinkedIn Profile (Placeholder)"
                >
                  <div className="text-white/80 group-hover/soc:text-[#0A66C2] transition-colors">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-white/80 group-hover/soc:text-white transition-colors">
                    LinkedIn
                  </span>
                </a>

                {/* X / Twitter */}
                <a
                  href="https://x.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc flex flex-col items-center justify-center gap-2.5 py-4 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/30 shadow-md hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105"
                  title="X (Twitter) Profile (Placeholder)"
                >
                  <div className="text-white/80 group-hover/soc:text-white transition-colors">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-white/80 group-hover/soc:text-white transition-colors">
                    X / Twitter
                  </span>
                </a>
              </div>
            </div>

            {/* Status & Availability Tag */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-white/60 font-medium">
                Available for freelance projects & frontend roles worldwide.
              </span>
            </div>

          </div>

          {/* Right Column: Submit Box (Glassmorphic Contact Form) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-white/[0.04] hover:bg-white/[0.05] backdrop-blur-2xl border border-white/10 hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-6 sm:p-8 md:p-10 transition-all duration-500 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />

              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Send a Message
              </h3>
              <p className="text-xs sm:text-sm text-white/60 mb-6 sm:mb-8 font-medium">
                Fill out the form below and I'll get back to you promptly.
              </p>

              {status === 'sent' ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 text-2xl shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                    ✓
                  </div>
                  <h4 className="text-xl font-bold text-white">
                    Message Sent!
                  </h4>
                  <p className="text-sm text-white/70 max-w-sm leading-relaxed">
                    Thank you for reaching out, {formData.name || 'there'}! Your message has been received and I will reply to <span className="text-white font-semibold">{formData.email}</span> shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('idle');
                      setFormData({ name: '', email: '', message: '' });
                    }}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-white/30 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                        Your Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. john@example.com"
                        className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-white/30 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/80 uppercase tracking-wider block">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell me about your project, timeline, or idea..."
                      className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/10 focus:border-white/30 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none card-scrollbar"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full py-4 px-6 rounded-2xl bg-white text-black font-bold text-sm sm:text-base hover:bg-white/90 shadow-[0_4px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_32px_rgba(255,255,255,0.25)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75"
                  >
                    {status === 'sending' ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <span className="text-base font-bold transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function TechLogo({ name, className = "w-5 h-5 sm:w-6 sm:h-6 shrink-0" }) {
  switch (name) {
    case 'HTML5':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M4 3l1.6 18 6.4 2 6.4-2 1.6-18H4z" fill="#E34F26" />
          <path d="M12 21.2l5.1-1.6 1.3-14.6H12v16.2z" fill="#EF652A" />
          <path d="M12 7.7H8.3l.3 3.3h3.4V7.7zm0 6.6l-.1.03-2.2-.6-.1-1.6H7.8l.3 3.4 3.9 1.1v-2.33z" fill="#ECECEC" />
          <path d="M12 7.7v3.3h3.3l-.3 3.3-3 .8v2.4l4.9-1.4.6-6.4H12z" fill="#FFFFFF" />
        </svg>
      );
    case 'CSS3':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M4 3l1.6 18 6.4 2 6.4-2 1.6-18H4z" fill="#1572B6" />
          <path d="M12 21.2l5.1-1.6 1.3-14.6H12v16.2z" fill="#33A9DC" />
          <path d="M12 7.7H8.3l.3 3.3h3.4V7.7zm0 6.6l-.1.03-2.2-.6-.1-1.6H7.8l.3 3.4 3.9 1.1v-2.33z" fill="#ECECEC" />
          <path d="M12 7.7v3.3h3.3l-.3 3.3-3 .8v2.4l4.9-1.4.6-6.4H12z" fill="#FFFFFF" />
        </svg>
      );
    case 'JavaScript':
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <rect width="24" height="24" rx="4" fill="#F7DF1E" />
          <path d="M7 17.5c.8.5 1.7.8 2.5.8 1.4 0 2.2-.7 2.2-2.1v-5.4H9.8v5.3c0 .8-.4 1.2-1.1 1.2-.5 0-.9-.2-1.2-.4l-.5 1.6zm6.8-.2c.9.6 2 .9 3 .9 2.4 0 3.7-1.2 3.7-3 0-1.6-1-2.4-2.8-3.1-.9-.4-1.4-.7-1.4-1.3 0-.6.5-1 1.4-1 .8 0 1.5.3 2 .6l.6-1.5c-.6-.4-1.5-.7-2.6-.7-2.2 0-3.5 1.3-3.5 2.9 0 1.6 1.1 2.5 2.7 3.1.9.4 1.5.8 1.5 1.4 0 .7-.6 1.2-1.7 1.2-.9 0-1.8-.4-2.4-.8l-.5 1.4z" fill="#000000" />
        </svg>
      );
    case 'React.js':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="#61DAFB" strokeWidth="1.4" />
          <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="1.8" fill="#61DAFB" />
        </svg>
      );
    case 'Tailwind CSS':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12.5 7.5c1.5-2.5 4-3.5 6.5-2.5 3 1.2 3.5 4.5 1.5 7-1.5 2-3.5 2.5-5 5-1-1.5-.5-3.5 1-4.5 1.5-1 1.5-2.5.5-3.5-1.5-1.5-3.5-.5-4.5-1.5zm-8 6c1.5-2.5 4-3.5 6.5-2.5 3 1.2 3.5 4.5 1.5 7-1.5 2-3.5 2.5-5 5-1-1.5-.5-3.5 1-4.5 1.5-1 1.5-2.5.5-3.5-1.5-1.5-3.5-.5-4.5-1.5z" fill="#38BDF8" />
        </svg>
      );
    case 'Redux Toolkit':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M15.4 7.2c1.7 1 2.6 2.8 2.6 4.8 0 2.2-1.1 4.1-3 5-1.9 1-4.3.7-5.9-.6-1.6-1.3-2.3-3.4-1.8-5.3.5-2 2-3.6 4-4.1.5-.1 1-.2 1.5-.2 1.3 0 2.6.4 3.7 1.2l-1.1 1.7c-.8-.6-1.7-.9-2.6-.9-1.7 0-3.1 1.1-3.6 2.6-.5 1.5 0 3.2 1.3 4.2 1.3 1 3.1 1.2 4.6.5 1.5-.8 2.4-2.2 2.4-3.8 0-1.4-.7-2.7-1.9-3.4l1.3-1.7z" fill="#764ABC" />
          <circle cx="12" cy="12" r="2.2" fill="#764ABC" />
        </svg>
      );
    case 'React Router':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M4 7a3 3 0 013-3h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7z" fill="#CA4245" />
          <path d="M8 8h4.5a2.5 2.5 0 010 5H10v3H8V8zm2 3.5h2.5a1 1 0 000-2H10v2zm4 1.5l2.5 3h2l-2.7-3.2A2.4 2.4 0 0016 11V8h-2v5z" fill="#FFFFFF" />
        </svg>
      );
    case 'REST APIs':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14l4-4 4 4 8-8" />
          <circle cx="4" cy="14" r="2" fill="#38BDF8" />
          <circle cx="12" cy="14" r="2" fill="#38BDF8" />
          <circle cx="20" cy="6" r="2" fill="#38BDF8" />
          <path d="M6 19h12" />
        </svg>
      );
    case 'Git':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M21.7 10.9l-8.6-8.6a1.5 1.5 0 00-2.1 0L9.1 4.2l3.4 3.4a1.8 1.8 0 012.3 2.3l2.8 2.8a1.8 1.8 0 11-1.1 1.1l-2.6-2.6v4.6a1.8 1.8 0 11-1.5 0V11a1.8 1.8 0 01-1-2.3L8 5.3 2.3 11a1.5 1.5 0 000 2.1l8.6 8.6a1.5 1.5 0 002.1 0l8.7-8.7a1.5 1.5 0 000-2.1z" fill="#F05032" />
        </svg>
      );
    case 'GitHub':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#FFFFFF">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case 'Next.js':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <circle cx="12" cy="12" r="11" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M15.5 8v8m-7-8v8l8-7.8" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'Node.js':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2l8.5 4.9v9.8L12 21.6l-8.5-4.9V6.9L12 2z" fill="#5FA04E" />
          <path d="M12 4.2l6.8 3.9v7.8L12 19.8l-6.8-3.9V8.1L12 4.2z" fill="#333333" />
          <path d="M12 7l4 2.3v4.6L12 16.2l-4-2.3V9.3L12 7z" fill="#5FA04E" />
        </svg>
      );
    case 'MongoDB':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2C11.5 3 8 7.5 8 13c0 4 3 6.5 4 8 1-1.5 4-4 4-8 0-5.5-3.5-10-4-11z" fill="#47A248" />
          <path d="M12 2v19c1-1.5 4-4 4-8 0-5.5-3.5-10-4-11z" fill="#499D4A" />
          <path d="M12 21.5c-.3-.5-1-1.5-1-2.5h2c0 1-.7 2-1 2.5z" fill="#FFFFFF" />
        </svg>
      );
    default:
      return null;
  }
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const containerRef    = useRef(null);
  const canvasRef       = useRef(null);
  const ctxRef          = useRef(null);
  const menuRef         = useRef(null);
  const aboutRef        = useRef(null);

  // Navigation and UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [activeNav, setActiveNav]   = useState('HOME');
  const [isAboutVisible, setIsAboutVisible] = useState(false);

  // Synchronize menu mount/unmount with smooth exit animation
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuMounted(true);
    } else {
      const timer = setTimeout(() => setIsMenuMounted(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isMenuOpen]);

  // Frame data: ImageBitmap[] for GPU-ready textures, Image[] as fallback
  const bitmapsRef      = useRef(new Array(TOTAL_FRAMES).fill(null));
  const imagesRef       = useRef([]);

  const currentFrameRef = useRef(0);
  const targetFrameRef  = useRef(0);
  const lastDrawnFrame  = useRef(-1);
  const needsRender     = useRef(true);
  const rafId           = useRef(null);
  const lastTimeRef     = useRef(0);
  const hasInteracted   = useRef(false);

  // Close menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // ── Sync URL & Route on mount / change ─────────────────────────────
  useEffect(() => {
    if (location.pathname === '/about') {
      setActiveNav('ABOUT');
      const timer = setTimeout(() => {
        const el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/service' || location.pathname === '/services') {
      setActiveNav('SERVICE');
      const timer = setTimeout(() => {
        const el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/skills' || location.pathname === '/skill') {
      setActiveNav('SKILLS');
      const timer = setTimeout(() => {
        const el = document.getElementById('skills');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/projects' || location.pathname === '/project') {
      setActiveNav('PROJECTS');
      const timer = setTimeout(() => {
        const el = document.getElementById('projects');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/clients' || location.pathname === '/client') {
      setActiveNav('CLIENTS');
      const timer = setTimeout(() => {
        const el = document.getElementById('clients');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/contact') {
      setActiveNav('CONTACT');
      const timer = setTimeout(() => {
        const el = document.getElementById('contact');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    } else if (location.pathname === '/' || location.pathname === '/home') {
      setActiveNav('HOME');
    }
  }, [location.pathname]);

  // ── Scroll Spy to synchronize active nav item with visible section ─
  useEffect(() => {
    const handleScrollSpy = () => {
      const aboutEl = document.getElementById('about');
      const servicesEl = document.getElementById('services');
      const skillsEl = document.getElementById('skills');
      const projectsEl = document.getElementById('projects');
      const clientsEl = document.getElementById('clients');
      const contactEl = document.getElementById('contact');
      if (!aboutEl) return;

      const contactTop = contactEl ? contactEl.getBoundingClientRect().top : Infinity;
      const clientsTop = clientsEl ? clientsEl.getBoundingClientRect().top : Infinity;
      const projectsTop = projectsEl ? projectsEl.getBoundingClientRect().top : Infinity;
      const skillsTop = skillsEl ? skillsEl.getBoundingClientRect().top : Infinity;
      const servicesTop = servicesEl ? servicesEl.getBoundingClientRect().top : Infinity;
      const aboutTop = aboutEl.getBoundingClientRect().top;

      if (contactTop <= window.innerHeight * 0.45) {
        setActiveNav('CONTACT');
        if (window.location.pathname !== '/contact') {
          window.history.replaceState(null, '', '/contact');
        }
      } else if (clientsTop <= window.innerHeight * 0.45) {
        setActiveNav('CLIENTS');
        if (window.location.pathname !== '/clients') {
          window.history.replaceState(null, '', '/clients');
        }
      } else if (projectsTop <= window.innerHeight * 0.45) {
        setActiveNav('PROJECTS');
        if (window.location.pathname !== '/projects') {
          window.history.replaceState(null, '', '/projects');
        }
      } else if (skillsTop <= window.innerHeight * 0.45) {
        setActiveNav('SKILLS');
        if (window.location.pathname !== '/skills') {
          window.history.replaceState(null, '', '/skills');
        }
      } else if (servicesTop <= window.innerHeight * 0.45) {
        setActiveNav('SERVICE');
        if (window.location.pathname !== '/service') {
          window.history.replaceState(null, '', '/service');
        }
      } else if (aboutTop <= window.innerHeight * 0.45) {
        setActiveNav('ABOUT');
        if (window.location.pathname !== '/about') {
          window.history.replaceState(null, '', '/about');
        }
      } else {
        setActiveNav('HOME');
        if (window.location.pathname !== '/') {
          window.history.replaceState(null, '', '/');
        }
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, []);

  // ── Intersection Observer for About text reveal animation ─────────
  useEffect(() => {
    const el = aboutRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAboutVisible(true);
          observer.unobserve(el); // trigger once
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Navigation handler ────────────────────────────────────────────
  const handleNavClick = (item) => {
    setActiveNav(item);
    setIsMenuOpen(false);

    if (item === 'HOME') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item === 'ABOUT') {
      navigate('/about');
      const el = document.getElementById('about');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'SERVICE') {
      navigate('/service');
      const el = document.getElementById('services');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'SKILLS') {
      navigate('/skills');
      const el = document.getElementById('skills');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'PROJECTS') {
      navigate('/projects');
      const el = document.getElementById('projects');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'CLIENTS') {
      navigate('/clients');
      const el = document.getElementById('clients');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item === 'CONTACT') {
      navigate('/contact');
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/${item.toLowerCase()}`);
      const el = document.getElementById(item.toLowerCase());
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        const projectsEl = document.getElementById('projects');
        if (projectsEl) projectsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // ── Image helpers ──────────────────────────────────────────────────

  /** Return the best renderable source for a frame index */
  const getFrame = useCallback((index) => {
    const ci = Math.max(0, Math.min(TOTAL_FRAMES - 1, index));

    // Prefer ImageBitmap (pre-decoded, GPU-ready)
    if (bitmapsRef.current[ci]) return bitmapsRef.current[ci];

    // Fallback to HTMLImageElement
    const img = imagesRef.current[ci];
    if (img?.complete && img.naturalWidth > 0) return img;

    // Search outward for closest available frame
    for (let off = 1; off < TOTAL_FRAMES; off++) {
      const p = ci - off;
      if (p >= 0) {
        if (bitmapsRef.current[p]) return bitmapsRef.current[p];
        const pi = imagesRef.current[p];
        if (pi?.complete && pi.naturalWidth > 0) return pi;
      }
      const n = ci + off;
      if (n < TOTAL_FRAMES) {
        if (bitmapsRef.current[n]) return bitmapsRef.current[n];
        const ni = imagesRef.current[n];
        if (ni?.complete && ni.naturalWidth > 0) return ni;
      }
    }
    return null;
  }, []);

  /** Pre-create ImageBitmaps around the current frame for instant rendering */
  const prefetchAround = useCallback((frameIndex) => {
    const center = Math.round(frameIndex);
    for (let off = -PREFETCH_RANGE; off <= PREFETCH_RANGE; off++) {
      const idx = center + off;
      if (idx < 0 || idx >= TOTAL_FRAMES) continue;
      if (bitmapsRef.current[idx]) continue; // already done

      const img = imagesRef.current[idx];
      if (!img?.complete || !img.naturalWidth) continue;

      createImageBitmap(img).then((bmp) => {
        bitmapsRef.current[idx] = bmp;
        needsRender.current = true;
      }).catch(() => { /* fallback to drawImage(img) */ });
    }
  }, []);

  // ── Drawing ────────────────────────────────────────────────────────

  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true,
      });
    }
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Size canvas to full native resolution
    const dpr = window.devicePixelRatio || 1;
    const dw  = window.innerWidth;
    const dh  = window.innerHeight;
    const rw  = Math.round(dw * dpr);
    const rh  = Math.round(dh * dpr);

    if (canvas.width !== rw || canvas.height !== rh) {
      canvas.width  = rw;
      canvas.height = rh;
      canvas.style.width  = `${dw}px`;
      canvas.style.height = `${dh}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const source = getFrame(frameIndex);
    if (!source) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, rw, rh);
      return;
    }

    // Source dimensions (works for both ImageBitmap and HTMLImageElement)
    const iW = source.width  || source.naturalWidth  || 1920;
    const iH = source.height || source.naturalHeight || 1080;

    const canvasAspect = rw / rh;
    const imgAspect    = iW / iH;

    let drawW, drawH, drawX, drawY;
    if (canvasAspect > imgAspect) {
      drawW = rw;
      drawH = rw / imgAspect;
      drawX = 0;
      drawY = (rh - drawH) / 2;
    } else {
      drawH = rh;
      drawW = rh * imgAspect;
      drawX = (rw - drawW) / 2;
      drawY = 0;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, rw, rh);
    ctx.drawImage(source, drawX, drawY, drawW, drawH);
  }, [getFrame]);

  // ── Scroll → frame mapping ────────────────────────────────────────

  const calculateTargetFrame = useCallback(() => {
    const container = containerRef.current;
    const scrollY = window.scrollY ?? window.pageYOffset ?? 0;
    const total   = container
      ? container.scrollHeight
      : document.documentElement.scrollHeight;
    const max      = Math.max(1, total - window.innerHeight);
    const progress = Math.min(Math.max(scrollY / max, 0), 1);

    targetFrameRef.current = progress * (TOTAL_FRAMES - 1);
  }, []);

  // ── Lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    // ── Phase 1: Load all Image elements ──
    const images = new Array(TOTAL_FRAMES);

    frameUrls.forEach((url, index) => {
      const img    = new Image();
      img.decoding = 'async';
      img.src      = url;
      img.onload   = () => {
        needsRender.current = true;
        createImageBitmap(img).then((bmp) => {
          bitmapsRef.current[index] = bmp;
          needsRender.current = true;
        }).catch(() => {});
      };
      images[index] = img;
    });

    imagesRef.current = images;

    // Sync to current scroll position immediately
    calculateTargetFrame();
    currentFrameRef.current = targetFrameRef.current;
    needsRender.current     = true;

    // ── Event handlers ──

    const handleScroll = () => {
      calculateTargetFrame();

      // First scroll: snap instantly, no lerp delay
      if (!hasInteracted.current) {
        hasInteracted.current   = true;
        currentFrameRef.current = targetFrameRef.current;
        needsRender.current     = true;
      }
    };

    const handleResize = () => {
      calculateTargetFrame();
      needsRender.current = true;
      ctxRef.current = null;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // ── Render loop (frame-rate-independent) ──

    const renderLoop = (timestamp) => {
      const dt = lastTimeRef.current
        ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
        : 1 / 60;
      lastTimeRef.current = timestamp;

      const diff    = targetFrameRef.current - currentFrameRef.current;
      const absDiff = Math.abs(diff);

      if (absDiff > SNAP_THRESH) {
        const speed  = Math.min(absDiff / VELOCITY_SCALE, 1);
        const boost  = 1 + speed * (VELOCITY_BOOST - 1);
        const factor = 1 - Math.pow(1 - BASE_LERP * boost, dt * 60);
        currentFrameRef.current += diff * factor;
        needsRender.current = true;
      } else if (absDiff > 0) {
        currentFrameRef.current = targetFrameRef.current;
        needsRender.current = true;
      }

      const activeFrame = Math.round(currentFrameRef.current);

      if (needsRender.current || activeFrame !== lastDrawnFrame.current) {
        drawFrame(activeFrame);
        lastDrawnFrame.current = activeFrame;
        needsRender.current    = false;

        // Pre-decode nearby frames for seamless scrubbing
        prefetchAround(currentFrameRef.current);
      }

      rafId.current = requestAnimationFrame(renderLoop);
    };

    rafId.current = requestAnimationFrame(renderLoop);

    // ── Cleanup ──
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafId.current) cancelAnimationFrame(rafId.current);

      bitmapsRef.current.forEach((bmp) => bmp?.close?.());
      bitmapsRef.current = new Array(TOTAL_FRAMES).fill(null);
    };
  }, [calculateTargetFrame, drawFrame, prefetchAround]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black select-none"
    >
      {/* Background Animated Canvas (Preserved Exactly) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'block',
          pointerEvents: 'none',
          imageRendering: 'auto',
          willChange: 'contents',
        }}
      />

      {/* ── Fixed Floating Header: Entisar Tag + Glassmorphic Dropdown ── */}
      <header className="fixed top-4 sm:top-7 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            className={`group flex items-center gap-3 sm:gap-4 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.12] hover:border-white/25 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)_inset] active:scale-95 transition-all duration-300 cursor-pointer ${
              isMenuOpen ? 'ring-1 ring-white/30 border-white/40 bg-white/[0.12] shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.12)_inset]' : ''
            }`}
          >
            <span className="text-sm sm:text-base font-bold tracking-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
              Entisar
            </span>
            <span className={`flex items-center justify-center w-7 h-5 sm:w-8 sm:h-6 rounded-full bg-white/[0.08] group-hover:bg-white/[0.15] transition-all duration-300 ${isMenuOpen ? 'bg-white/[0.2] rotate-90 scale-105 shadow-[0_0_12px_rgba(255,255,255,0.2)]' : 'rotate-0'}`}>
              <span className="flex items-center gap-[3px]">
                <span className="w-[3px] h-[3px] rounded-full bg-white/90"></span>
                <span className="w-[3px] h-[3px] rounded-full bg-white/90"></span>
                <span className="w-[3px] h-[3px] rounded-full bg-white/90"></span>
              </span>
            </span>
          </button>

          {/* Glassmorphic Dropdown Menu */}
          {isMenuMounted && (
            <div
              role="menu"
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 sm:w-60 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-2 shadow-[0_16px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.06)_inset] z-50 origin-top ${
                isMenuOpen ? 'animate-dropdown-open' : 'animate-dropdown-close pointer-events-none'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                {NAV_ITEMS.map((item, idx) => {
                  const isActive = activeNav === item;
                  return (
                    <button
                      key={item}
                      role="menuitem"
                      onClick={() => handleNavClick(item)}
                      style={{ animationDelay: `${idx * 32}ms` }}
                      className={`animate-dropdown-item flex items-center justify-between px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold tracking-wider transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.2)] scale-[1.01]'
                          : 'text-white/75 hover:text-white hover:bg-white/[0.1] hover:translate-x-1'
                      }`}
                    >
                      <span>{item}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Page Content Sections (Single Page Architecture) ── */}
      <div className="relative z-10 w-full">

        {/* Section 1: Hero / Home */}
        <section
          id="home"
          className="min-h-[160vh] w-full pointer-events-none"
        />

        {/* Section 2: About Me Section (Matching Reference Layout) */}
        <section
          id="about"
          ref={aboutRef}
          className="min-h-screen w-full flex items-center justify-center px-4 sm:px-12 md:px-16 lg:px-20 py-20 sm:py-28 lg:py-32"
        >
          <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-8 items-center min-h-[50vh] lg:min-h-[60vh]">

            {/* Left Column: Heading & First Paragraph */}
            <div className="lg:col-span-4 flex flex-col justify-between h-full min-h-[180px] sm:min-h-[260px] lg:min-h-[460px] pointer-events-auto">
              <h2
                className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-black tracking-tight text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.95)] select-none"
                style={{
                  opacity: isAboutVisible ? 1 : 0,
                  transform: isAboutVisible ? 'translateY(0)' : 'translateY(32px)',
                  transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                Hey!
              </h2>

              <p
                className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-snug text-white/95 max-w-md drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] mt-4 sm:mt-8 lg:mt-auto"
                style={{
                  opacity: isAboutVisible ? 1 : 0,
                  transform: isAboutVisible ? 'translateY(0)' : 'translateY(32px)',
                  transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
                }}
              >
                I'm Entisar, a frontend developer based in Bangladesh, passionate about building modern, interactive, and visually engaging web experiences.
              </p>
            </div>

            {/* Center Column: Unobstructed opening for background video portrait */}
            <div className="hidden lg:flex lg:col-span-4 h-full min-h-[460px] pointer-events-none items-center justify-center">
              {/* Center frame is kept completely clear so the animated portrait canvas character is visible */}
            </div>

            {/* Right Column: Second Paragraph */}
            <div className="lg:col-span-4 flex flex-col justify-center lg:justify-end h-full min-h-[120px] sm:min-h-[200px] lg:min-h-[460px] pb-2 pointer-events-auto">
              <p
                className="text-xs sm:text-sm md:text-base lg:text-lg font-normal leading-relaxed text-white/80 max-w-md drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)]"
                style={{
                  opacity: isAboutVisible ? 1 : 0,
                  transform: isAboutVisible ? 'translateY(0)' : 'translateY(32px)',
                  transition: 'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
                }}
              >
                I enjoy turning ideas and designs into polished websites using technologies like React, JavaScript, and Tailwind CSS, while continuously learning and improving my craft.
              </p>
            </div>

          </div>
        </section>

        {/* Section 3: Services Section (Matching Reference Layout, No Numbers) */}
        <section
          id="services"
          className="min-h-screen w-full flex flex-col justify-center px-4 sm:px-12 md:px-16 lg:px-20 py-20 sm:py-28 lg:py-32 relative"
        >
          <div className="w-full max-w-7xl mx-auto">
            {/* Section Title */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tight text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.95)] mb-10 sm:mb-14 md:mb-20 select-none">
              Services
            </h2>

            {/* Services List with sleek dividers (No numbers) */}
            <div className="w-full border-t border-white/[0.08]">
              {SERVICES.map((service) => (
                <div
                  key={service.title}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-6 sm:py-9 md:py-11 border-b border-white/[0.08] transition-all duration-300 hover:bg-white/[0.03] px-3 sm:px-6 -mx-3 sm:-mx-6 rounded-2xl cursor-default pointer-events-auto"
                >
                  {/* Left: Title only */}
                  <div className="flex items-center">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white/95 group-hover:text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover:translate-x-1">
                      {service.title}
                    </h3>
                  </div>

                  {/* Right: Description text */}
                  <p className="text-xs sm:text-sm md:text-base font-medium text-white/55 group-hover:text-white/80 text-left sm:text-right max-w-md lg:max-w-xl leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-colors duration-300">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Skills Section (Compact Horizontal Auto-Moving Glassmorphic Slider) */}
        <section
          id="skills"
          className="w-full py-14 sm:py-20 overflow-hidden relative pointer-events-auto"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-12 md:px-16 lg:px-20 mb-6 sm:mb-8">
            {/* Section Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] select-none">
              Skills
            </h2>
          </div>

          {/* Infinite Carousel Container with edge gradient masks */}
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee flex items-center gap-3 sm:gap-5 py-3">
              {/* Duplicated items for seamless continuous infinite loop */}
              {[...SKILLS, ...SKILLS].map((skill, index) => (
                <div
                  key={`${skill.name}-${index}`}
                  className="group flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-xl border border-white/[0.08] hover:border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.05)] transition-all duration-300 whitespace-nowrap cursor-default shrink-0"
                >
                  <TechLogo name={skill.name} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-white/85 group-hover:text-white transition-colors">
                    {skill.name}
                  </span>
                  {skill.isLearning && (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/25 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)] ml-0.5">
                      Learning
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Projects Section (Glassmorphism Cards with Hover Zoom) */}
        <section
          id="projects"
          className="w-full py-20 sm:py-28 lg:py-32 px-4 sm:px-12 md:px-16 lg:px-20 relative pointer-events-auto"
        >
          <div className="w-full max-w-7xl mx-auto">
            {/* Section Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] mb-8 sm:mb-12 select-none">
              Projects
            </h2>

            {/* 3 Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
              {PROJECTS.map((project) => (
                <div
                  key={project.title}
                  className="group relative flex flex-col rounded-3xl bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-2xl border border-white/[0.08] hover:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:shadow-[0_16px_48px_rgba(255,255,255,0.06)] transition-all duration-500 overflow-hidden hover:-translate-y-1"
                >
                  {/* Thumbnail with subtle zoom-in animation on card hover */}
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl m-2.5 sm:m-3.5 bg-black/40 border border-white/5 relative">
                    <img
                      src={project.thumbnail}
                      alt={`${project.title} preview`}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Project Name */}
                  <div className="px-4 sm:px-5 pt-1.5 pb-3 sm:pb-4">
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] transition-colors group-hover:text-white">
                      {project.title}
                    </h3>
                  </div>

                  {/* Action Buttons: Live Website + GitHub */}
                  <div className="flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 pb-4 sm:pb-5 mt-auto">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-white/90 shadow-[0_2px_12px_rgba(255,255,255,0.12)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all duration-300 group/btn"
                    >
                      <span>Live Website</span>
                      <span className="text-xs font-bold transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5">
                        ↗
                      </span>
                    </a>

                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-semibold text-xs sm:text-sm border border-white/[0.1] hover:border-white/25 transition-all duration-300"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>GitHub</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Clients Section (Glassmorphism 3D Flip Review Cards) */}
        <section
          id="clients"
          className="w-full py-20 sm:py-28 lg:py-32 px-4 sm:px-12 md:px-16 lg:px-20 relative pointer-events-auto"
        >
          <div className="w-full max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] select-none">
                Clients
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-white/55 mt-2.5 sm:mt-3 max-w-lg font-medium leading-relaxed">
                Reviews and testimonials from people I've collaborated with. Hover or tap any card to view the complete review.
              </p>
            </div>

            {/* 3 Client Flip Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
              {CLIENTS.map((client) => (
                <ClientCard key={client.name} client={client} />
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Contact Section */}
        <ContactSection />

        {/* Minimal Bottom Footer */}
        <footer className="w-full py-8 sm:py-10 border-t border-white/[0.06] px-4 sm:px-12 md:px-16 lg:px-20 text-center pointer-events-auto">
          <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-white/40 font-medium">
            <p>© {new Date().getFullYear()} Entisar. All rights reserved.</p>
            <button
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-white/50 hover:text-white/90 transition-all duration-300 cursor-pointer group"
            >
              <span>Back to top</span>
              <span className="text-sm transition-transform duration-300 group-hover:-translate-y-1">↑</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
