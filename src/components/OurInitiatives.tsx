import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface Initiative {
    id: string;
    name: string;
    description: string;
    logo: string;
    href: string | null;
    order: number;
    isActive: boolean;
}

const BASE_URL = 'https://sohub.com.bd';

/* ──────────────────────────────────────────────
   DESKTOP VERSION
   ────────────────────────────────────────────── */
const DesktopOurInitiatives = ({ initiatives }: { initiatives: Initiative[] }) => {
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true, margin: '-10%' });

    return (
        <section id="initiatives" className="py-20 bg-[#f8f9fa] relative overflow-hidden">
            <div className="container-main relative z-10">
                {/* Header */}
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 25 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-14"
                >
                    <h2
                        className="text-[48px] font-normal tracking-tight text-[#0d0925] leading-[1.15]"
                    >
                        Explore Our Initiatives
                    </h2>
                    <p className="text-lg text-[#5f6368] max-w-2xl mx-auto mt-4 font-normal">
                        Each initiatives solves a real problem.
                    </p>
                </motion.div>

                {/* Grid — Google-style 4 columns */}
                <div className="max-w-[1200px] mx-auto grid grid-cols-4 gap-5">
                    {initiatives.map((item, i) => {
                        const CardContent = (
                            <>
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <img
                                        src={`${BASE_URL}${item.logo}`}
                                        alt={item.name}
                                        className="w-12 h-12 object-contain flex-shrink-0"
                                    />
                                    <span
                                        className="text-[16px] font-medium text-[#3c4043] truncate"
                                    >
                                        {item.name}
                                    </span>
                                </div>
                                {item.href && (
                                    <ExternalLink className="w-5 h-5 text-[#9aa0a6] flex-shrink-0 group-hover:text-[#5f6368] transition-colors" />
                                )}
                            </>
                        );

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={headerInView ? { opacity: 1, y: 0 } : {}}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.1 + i * 0.04,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            >
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-4 bg-white border border-[#e8eaed] rounded-2xl px-6 py-5 hover:border-[#fb8a09]/30 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer"
                                    >
                                        {CardContent}
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-4 bg-white border border-[#e8eaed] rounded-2xl px-6 py-5">
                                        {CardContent}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

/* ──────────────────────────────────────────────
   MOBILE VERSION — Google product list style
   ────────────────────────────────────────────── */
const MobileOurInitiatives = ({ initiatives }: { initiatives: Initiative[] }) => {
    const headerRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true, margin: '-5%' });

    return (
        <section id="initiatives" className="py-10 bg-[#f8f9fa]">
            <div className="px-4">
                {/* Header */}
                <motion.div
                    ref={headerRef}
                    initial={{ opacity: 0, y: 16 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-6"
                >
                    <h2
                        className="text-[22px] font-medium tracking-tight text-[#0d0925] leading-[1.2]"
                    >
                        Explore Our Initiatives
                    </h2>
                    <p className="text-sm text-[#5f6368] max-w-xs mx-auto mt-2.5 font-normal leading-relaxed">
                        Each initiatives solves a real problem.
                    </p>
                </motion.div>

                {/* List — single column, Google style */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col gap-2"
                >
                    {initiatives.map((item) => {
                        const CardContent = (
                            <div className="flex items-center w-full px-4 py-4">
                                <img
                                    src={`${BASE_URL}${item.logo}`}
                                    alt={item.name}
                                    className="w-10 h-10 object-contain flex-shrink-0"
                                />
                                <span
                                    className="text-[15px] font-medium text-[#3c4043] ml-4 flex-1 truncate"
                                >
                                    {item.name}
                                </span>
                                {item.href && (
                                    <ExternalLink className="w-[18px] h-[18px] text-[#9aa0a6] flex-shrink-0 ml-3" />
                                )}
                            </div>
                        );

                        return item.href ? (
                            <a
                                key={item.id}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white border border-[#e8eaed] rounded-2xl active:bg-gray-50 transition-colors"
                            >
                                {CardContent}
                            </a>
                        ) : (
                            <div
                                key={item.id}
                                className="block bg-white border border-[#e8eaed] rounded-2xl"
                            >
                                {CardContent}
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

/* ──────────────────────────────────────────────
   MAIN EXPORT
   ────────────────────────────────────────────── */
export const OurInitiatives = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        fetch('https://sohub.com.bd/api/initiatives.json', {
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        })
            .then((res) => res.json())
            .then((data) => {
                const active = (Array.isArray(data) ? data : data.initiatives || [])
                    .filter((i: Initiative) => i.isActive)
                    .sort((a: Initiative, b: Initiative) => a.order - b.order);
                setInitiatives(active);
            })
            .catch(() => { });
    }, []);

    if (initiatives.length === 0) return null;

    if (isMobile) {
        return <MobileOurInitiatives initiatives={initiatives} />;
    }

    return <DesktopOurInitiatives initiatives={initiatives} />;
};
