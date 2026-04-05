import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Sparkles, ArrowRight, Users, Calendar, Award, MapPin, CheckCircle2, Play, ChevronDown, BookOpen, MousePointer2, Image as ImageIcon } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface LandingProps {
  onStart: () => void;
}

function AlbumShowcase() {
  const [step, setStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) {
        setStep((prev) => (prev + 1) % 3);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const steps = [
    {
      title: "Escolha suas Fotos",
      icon: MousePointer2,
      content: (
        <div className="grid grid-cols-3 gap-4 p-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="aspect-square rounded-lg bg-white/10 border border-white/20 overflow-hidden relative group"
            >
              <img 
                src={`https://picsum.photos/seed/album-${i}/400/400`} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                alt="Selection"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-brand-gold/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <CheckCircle2 className="text-white w-6 h-6" />
              </div>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: "Design Inteligente",
      icon: Sparkles,
      content: (
        <div className="relative h-full flex items-center justify-center p-8">
          <div className="w-full max-w-md aspect-[4/3] bg-zinc-900 rounded-lg border-2 border-brand-gold/30 shadow-2xl relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 to-transparent" />
            
            {/* Scanning Line */}
            <motion.div 
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-brand-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.8)] z-20"
            />

            <div className="relative z-10 space-y-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "40%" }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                className="h-4 bg-brand-gold/20 rounded" 
              />
              
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: i * 0.5, duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
                    className="aspect-square bg-white/5 rounded-lg border border-white/10 overflow-hidden"
                  >
                    <img 
                      src={`https://picsum.photos/seed/design-${i}/300/300`} 
                      className="w-full h-full object-cover opacity-60"
                      alt="Design element"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ))}
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatDelay: 1.5 }}
                className="h-24 w-full bg-white/5 rounded-lg border border-white/10 p-4"
              >
                <div className="space-y-2">
                  <div className="h-2 w-full bg-white/10 rounded" />
                  <div className="h-2 w-5/6 bg-white/10 rounded" />
                  <div className="h-2 w-4/6 bg-white/10 rounded" />
                </div>
              </motion.div>
            </div>

            {/* Magic Particles */}
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [Math.random() * 400, Math.random() * 400],
                  y: [Math.random() * 300, Math.random() * 300],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                className="absolute w-1 h-1 bg-brand-gold rounded-full blur-[1px]"
              />
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Resultado 3D Premium",
      icon: BookOpen,
      content: (
        <div className="relative h-full flex items-center justify-center perspective-[2000px]">
          {/* Ambient Glow */}
          <div className="absolute w-96 h-96 bg-brand-gold/20 blur-[120px] rounded-full animate-pulse" />
          
          <div className="relative w-72 h-96 preserve-3d">
            {/* Album Stack (Depth Effect) */}
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="absolute inset-0 bg-zinc-900 border border-white/5 rounded-r-lg shadow-2xl"
                style={{ transform: `translateZ(${-i * 2}px)` }}
              />
            ))}

            {/* Back Page (Fixed) */}
            <div className="absolute inset-0 bg-white rounded-r-lg shadow-inner overflow-hidden">
              <img 
                src="https://picsum.photos/seed/page-back/800/1000" 
                className="w-full h-full object-cover opacity-90"
                alt="Album Page"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
            </div>

            {/* Flipping Page */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: [-5, -170, -5] }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
              className="absolute inset-0 bg-white rounded-r-lg shadow-2xl origin-left preserve-3d z-10"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-0 p-1 border-r border-brand-gold/20">
                <img 
                  src="https://picsum.photos/seed/page-flip/800/1000" 
                  className="w-full h-full object-cover"
                  alt="Album Page Content"
                  referrerPolicy="no-referrer"
                />
              </div>
              {/* Back side of the flipping page */}
              <div 
                className="absolute inset-0 bg-zinc-100 rotate-y-180"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="h-full w-full p-8 flex flex-col justify-center border-l-4 border-brand-gold/30">
                  <div className="space-y-4">
                    <div className="h-2 w-24 bg-brand-gold/20 rounded" />
                    <div className="h-2 w-32 bg-brand-gold/10 rounded" />
                    <div className="grid grid-cols-2 gap-2 pt-4">
                      <div className="aspect-square bg-zinc-200 rounded overflow-hidden">
                        <img src="https://picsum.photos/seed/mini-1/200/200" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                      </div>
                      <div className="aspect-square bg-zinc-200 rounded overflow-hidden">
                        <img src="https://picsum.photos/seed/mini-2/200/200" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Front Cover */}
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{ rotateY: [0, -110, 0] }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                times: [0, 0.4, 1]
              }}
              className="absolute inset-0 bg-zinc-950 rounded-r-lg border-2 border-brand-gold/40 shadow-[15px_0_30px_rgba(0,0,0,0.5)] origin-left preserve-3d z-20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              
              {/* Gold Foil Effect */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="topline-black text-4xl mb-6 bg-gradient-to-b from-brand-gold via-white to-brand-gold bg-clip-text text-transparent"
                >
                  Top Line
                </motion.div>
                <div className="w-16 h-[1px] bg-brand-gold/50 mb-6" />
                <div className="text-[10px] uppercase tracking-[0.6em] text-brand-gold font-bold">
                  Premium Album
                </div>
                <div className="mt-2 text-[8px] uppercase tracking-[0.3em] text-brand-gold/40">
                  Class of 2026
                </div>
              </div>

              {/* Spine Detail */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black to-zinc-900 border-r border-white/5" />
            </motion.div>
          </div>

          {/* Floating Elements */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 4 + i, 
                repeat: Infinity,
                delay: i * 0.5
              }}
              className="absolute hidden md:block"
              style={{
                top: `${20 + i * 20}%`,
                left: i % 2 === 0 ? '10%' : '80%',
              }}
            >
              <div className="w-16 h-20 bg-white/5 border border-white/10 rounded shadow-2xl backdrop-blur-sm p-1">
                <div className="w-full h-full bg-zinc-800 rounded-sm overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/float-${i}/200/300`} 
                    className="w-full h-full object-cover grayscale"
                    alt="Floating memory"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div 
      className="mt-24 min-h-[600px] rounded-3xl overflow-hidden relative bg-zinc-950 border border-white/10 flex flex-col lg:flex-row"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Side: Info */}
      <div className="lg:w-1/3 p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/10 bg-black/50">
        <div className="space-y-8">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              className={`flex items-start gap-6 cursor-pointer transition-all ${step === i ? 'opacity-100 translate-x-2' : 'opacity-30 hover:opacity-50'}`}
              onClick={() => setStep(i)}
            >
              <div className={`p-4 rounded-2xl ${step === i ? 'bg-brand-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white'}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-serif mb-2">{s.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {i === 0 && "Selecione as fotos que marcaram sua trajetória de forma simples e intuitiva."}
                  {i === 1 && "Nossa tecnologia organiza suas memórias com o requinte que você merece."}
                  {i === 2 && "Visualize seu álbum físico em um ambiente 3D antes mesmo de ser impresso."}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side: Interactive Area */}
      <div className="flex-1 relative bg-black overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full"
          >
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        {/* Decorative elements */}
        <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20">
          <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">Preview Interativo</span>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onStart }: LandingProps) {
  const aboutRef = useRef<HTMLDivElement>(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-brand-gold/30">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background Sparkles Overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-gold/20 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-gold/10 blur-[150px] rounded-full" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-4 mb-12">
              <Sparkles className="w-5 h-5 text-brand-gold animate-pulse" />
              <div className="px-8 py-2.5 rounded-full border border-brand-gold/40 bg-brand-gold/5 text-brand-gold text-[10px] font-bold uppercase tracking-[0.4em]">
                20 Anos de Excelência em Formaturas
              </div>
              <Sparkles className="w-5 h-5 text-brand-gold animate-pulse" />
            </div>
            
            <h1 className="flex flex-col items-center mb-12">
              <span className="topline-black text-6xl md:text-8xl mb-4">Top Line</span>
              <div className="flex items-center gap-4">
                <div className="h-[2px] w-12 md:w-20 bg-brand-gold/50" />
                <span className="text-brand-gold text-2xl md:text-4xl font-serif italic tracking-[0.5em] uppercase">Black</span>
                <div className="h-[2px] w-12 md:w-20 bg-brand-gold/50" />
              </div>
            </h1>
            
            <p className="text-gray-400 text-xl md:text-2xl max-w-3xl mx-auto font-light tracking-wide leading-relaxed mb-16">
              A experiência definitiva em formaturas premium. 
              Transformamos sonhos em memórias eternas com exclusividade e sofisticação.
            </p>

            <div className="flex flex-col sm:flex-row gap-8 items-center">
              <button 
                onClick={onStart}
                className="gold-button group flex items-center gap-4 text-xl px-12 py-6"
              >
                Acessar Meu Studio
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={scrollToAbout}
                className="px-12 py-6 rounded-full border border-white/20 hover:bg-white/5 transition-all text-sm font-bold tracking-[0.2em] uppercase text-white backdrop-blur-sm"
              >
                Conhecer a Top Line
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 cursor-pointer"
          onClick={scrollToAbout}
        >
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold">Scroll</p>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* A Empresa Section */}
      <section ref={aboutRef} className="py-32 px-6 relative overflow-hidden bg-zinc-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-brand-gold/10 border border-white/10">
              <img 
                src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1200" 
                alt="Formatura Top Line" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-gold/10 blur-3xl rounded-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-8 flex items-center gap-4">
              A Empresa
              <div className="h-[1px] flex-1 bg-brand-gold/30" />
            </h2>
            <div className="space-y-6 text-gray-400 text-lg leading-relaxed font-light">
              <p>
                Concluir um curso de graduação é o sonho da maioria das pessoas. Por isso, para fazer desta conquista um momento único inesquecível, a <span className="text-white font-medium">Top Line Formaturas</span> oferece a você os melhores serviços.
              </p>
              <p>
                Desde os momentos ao lado de sua turma que antecedem o grande dia, até todos os detalhes que envolvem a organização deste tão esperado evento. Credibilidade e comprometimento são os nossos princípios básicos.
              </p>
              <p>
                Este rito de passagem deixa muitas lembranças como as amizades cultivadas durante os anos de estudos e os incentivos familiares. <span className="text-brand-gold font-medium italic">Você é único, por isso você é TOP.</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mt-32">
          {[
            { icon: Award, value: "20", label: "Anos de Experiência" },
            { icon: Calendar, value: "2.500", label: "Eventos Realizados" },
            { icon: Users, value: "75.000", label: "Alunos Formados" },
            { icon: MapPin, value: "54", label: "Cidades Atendidas" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center group hover:border-brand-gold/30 transition-colors"
            >
              <stat.icon className="w-8 h-8 text-brand-gold mx-auto mb-6 group-hover:scale-110 transition-transform" />
              <div className="text-4xl font-serif text-white mb-2">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* O Processo do Álbum 3D Section */}
      <section className="py-32 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-serif mb-6">O Processo do Álbum 3D</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto font-light">
              Uma experiência imersiva para eternizar seus momentos mais especiais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                title: "Seleção Exclusiva",
                desc: "Escolha suas melhores fotos através do nosso Studio inteligente.",
                step: "01"
              },
              {
                title: "Design Personalizado",
                desc: "Nossos designers criam um layout único que conta a sua história.",
                step: "02"
              },
              {
                title: "Visualização 3D",
                desc: "Sinta a emoção de folhear seu álbum digitalmente antes da impressão.",
                step: "03"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative p-10 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-brand-gold/20 transition-all group"
              >
                <div className="text-6xl font-serif text-brand-gold/10 absolute top-6 right-10 group-hover:text-brand-gold/20 transition-colors">
                  {item.step}
                </div>
                <h3 className="text-2xl font-serif text-white mb-4">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-brand-gold text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Saiba mais <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive Album Showcase */}
          <AlbumShowcase />
        </div>
      </section>

      {/* Nossos Serviços Section */}
      <section className="py-32 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-serif mb-6">Nossos Serviços</h2>
              <p className="text-gray-400 text-xl font-light max-w-xl">
                Uma empresa completa para transformar seus sonhos em realidade através de alta qualidade.
              </p>
            </div>
            <div className="h-[1px] flex-1 bg-brand-gold/20 hidden md:block mx-12 mb-6" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              "Colação de Grau", "Baile de Gala", "Culto Ecumênico", 
              "Jantar de Formatura", "Festa de Integração", "Pré-Eventos"
            ].map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center hover:bg-brand-gold/5 hover:border-brand-gold/30 transition-all"
              >
                <GraduationCap className="w-8 h-8 text-brand-gold mb-4" />
                <span className="text-sm font-bold uppercase tracking-wider text-gray-300">{service}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-3xl bg-gradient-to-br from-brand-gold/10 to-transparent border border-brand-gold/20">
            <h3 className="text-2xl font-serif mb-10 text-center">O que mais podemos te oferecer?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                "Assessoria Financeira", "Assessoria Jurídica", "Assessoria Organizacional", "Assessoria Prime",
                "Connect Top", "Espaços Sociais", "Festas de Integração", "Know How"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-400 group">
                  <CheckCircle2 className="w-5 h-5 text-brand-gold/50 group-hover:text-brand-gold transition-colors" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instituições Parceiras Section */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Instituições Parceiras</h2>
            <p className="text-gray-400 font-light">Confiança das maiores universidades do país.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 items-center opacity-50 grayscale hover:grayscale-0 transition-all">
            {/* Placeholder logos with university names */}
            {[
              "UFSC", "UNIVALI", "Positivo", "Uniguaçu", "UniBrasil", "Univille",
              "UniSociesc", "UFPR", "UTP", "PUCPR", "Unicuritiba", "Unisul"
            ].map((uni, i) => (
              <div key={i} className="flex items-center justify-center p-4">
                <span className="text-2xl font-serif font-bold text-white/40 hover:text-brand-gold transition-colors">{uni}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria de Fotos Section */}
      <section className="py-32 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-serif mb-6">Galeria de Fotos</h2>
            <p className="text-gray-400 text-xl font-light">Momentos inesquecíveis capturados pela nossa equipe.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              "https://images.unsplash.com/photo-1541339907198-e08756eaa589?auto=format&fit=crop&q=80&w=800",
              "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
              "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800",
              "https://images.unsplash.com/photo-1505232458567-cc265c599f07?auto=format&fit=crop&q=80&w=800",
              "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800",
              "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800"
            ].map((img, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02 }}
                className="aspect-square rounded-2xl overflow-hidden border border-white/10"
              >
                <img 
                  src={img} 
                  alt={`Gallery ${i}`} 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="py-20 px-6 border-t border-white/10 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start">
            <span className="topline-black text-3xl mb-2">Top Line</span>
            <p className="text-gray-500 text-sm tracking-[0.2em] uppercase font-bold">Black Edition</p>
          </div>
          
          <div className="flex gap-12 text-sm font-bold uppercase tracking-widest text-gray-400">
            <a href="#" className="hover:text-brand-gold transition-colors">Home</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Empresa</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Serviços</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Contato</a>
          </div>

          <button 
            onClick={onStart}
            className="gold-button px-10 py-4 text-sm"
          >
            Área do Aluno
          </button>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 text-center text-gray-600 text-xs tracking-widest uppercase">
          © 2026 Top Line Formaturas. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
