import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  Bell, 
  Music, 
  Plus, 
  AlarmClock, 
  Sparkles, 
  Settings, 
  X, 
  CheckCircle2, 
  Droplets, 
  PenLine, 
  Wind, 
  Lightbulb, 
  LogOut, 
  Smartphone, 
  Info, 
  Moon, 
  Sun,
  ChevronRight,
  Quote,
  Flame,
  Briefcase,
  Heart,
  Palette,
  Flower2
} from 'lucide-react';
import { Alarm, Task, Screen } from './types';

const INITIAL_ALARMS: Alarm[] = [
  { id: '1', time: '06:30', period: 'AM', days: ['MON', 'TUE', 'WED', 'THU', 'FRI'], sound: 'Birds Chirping', enabled: true, focus: 'Wellness' },
  { id: '2', time: '08:00', period: 'AM', days: ['SAT', 'SUN'], sound: 'Ocean Waves', enabled: true, focus: 'Creativity' },
  { id: '3', time: '10:45', period: 'AM', days: ['DAILY'], sound: 'Forest Mist', enabled: false, focus: 'Career' },
];

const INITIAL_TASKS: Task[] = [
  { id: '1', text: 'Drink water', subtext: 'Hydration is key', icon: 'droplets', completed: true },
  { id: '2', text: '3 Gratitude items', subtext: 'Write them in your journal', icon: 'pen', completed: false },
  { id: '3', text: 'Deep breathing', subtext: '3 sets of 5 breaths', icon: 'wind', completed: false },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('feed');
  const [alarms, setAlarms] = useState<Alarm[]>(INITIAL_ALARMS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [userName] = useState('Alex');
  const [visionImage, setVisionImage] = useState('https://picsum.photos/seed/vision/1920/1080');
  const [visionQuote, setVisionQuote] = useState('LBSNAA: Where dreams take flight.');

  // Add Material Symbols support
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const toggleAlarm = (id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'alarms':
        return <AlarmsScreen alarms={alarms} toggleAlarm={toggleAlarm} onAdd={() => setCurrentScreen('new-alarm')} userName={userName} />;
      case 'feed':
        return <FeedScreen tasks={tasks} toggleTask={toggleTask} userName={userName} visionImage={visionImage} visionQuote={visionQuote} />;
      case 'profile':
        return <ProfileScreen userName={userName} visionImage={visionImage} visionQuote={visionQuote} setVisionImage={setVisionImage} setVisionQuote={setVisionQuote} />;
      case 'new-alarm':
        return <NewAlarmScreen onSave={() => setCurrentScreen('alarms')} onClose={() => setCurrentScreen('alarms')} />;
      case 'wake-up':
        return <WakeUpScreen onDismiss={() => setCurrentScreen('feed')} visionImage={visionImage} />;
      case 'motivate':
        return <MotivateScreen onSave={() => setCurrentScreen('feed')} />;
      default:
        return <FeedScreen tasks={tasks} toggleTask={toggleTask} userName={userName} visionImage={visionImage} visionQuote={visionQuote} />;
    }
  };

  return (
    <div className="min-h-screen aura-sunrise-gradient selection:bg-primary-fixed selection:text-on-primary-fixed">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="pb-24"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      {currentScreen !== 'wake-up' && currentScreen !== 'new-alarm' && (
        <nav className="fixed bottom-0 left-0 w-full h-20 bg-white/70 backdrop-blur-2xl rounded-t-[2rem] z-50 flex justify-around items-center px-4 pb-safe shadow-[0_-8px_40px_rgba(0,0,0,0.04)]">
          <NavButton 
            active={currentScreen === 'alarms'} 
            onClick={() => setCurrentScreen('alarms')} 
            icon={<AlarmClock size={24} />} 
            label="Alarms" 
          />
          <NavButton 
            active={currentScreen === 'feed' || currentScreen === 'motivate'} 
            onClick={() => setCurrentScreen('feed')} 
            icon={<Sparkles size={24} />} 
            label="Feed" 
          />
          <NavButton 
            active={currentScreen === 'profile'} 
            onClick={() => setCurrentScreen('profile')} 
            icon={<Settings size={24} />} 
            label="Profile" 
          />
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-6 py-2 transition-all duration-300 ease-out active:scale-90 ${
        active 
          ? 'bg-orange-100 text-orange-700 rounded-full' 
          : 'text-zinc-400 hover:text-orange-500'
      }`}
    >
      <div className={active ? 'fill-current' : ''}>{icon}</div>
      <span className="font-headline text-[11px] font-semibold uppercase tracking-wider mt-1">{label}</span>
    </button>
  );
}

// --- SCREENS ---

function AlarmsScreen({ alarms, toggleAlarm, onAdd, userName }: { alarms: Alarm[], toggleAlarm: (id: string) => void, onAdd: () => void, userName: string }) {
  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto">
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <Menu className="text-zinc-400 cursor-pointer" />
          <span className="text-xl font-extrabold text-orange-600 italic font-headline tracking-tight">Rise & Shine</span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high">
          <img src="https://picsum.photos/seed/alex/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      <section className="mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-2">
          Good Morning, <span className="text-primary">{userName}</span>
        </h1>
        <p className="font-body text-xl text-on-surface-variant italic">
          The sun is waiting for your light.
        </p>
      </section>

      <div className="space-y-6">
        {alarms.map(alarm => (
          <div 
            key={alarm.id} 
            className={`rounded-lg p-6 flex items-center justify-between shadow-sm border border-transparent transition-all duration-300 ${
              alarm.enabled ? 'bg-surface-container-lowest' : 'bg-surface-container-low opacity-60'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-1">
                <span className={`font-headline text-5xl font-extrabold tracking-tighter ${alarm.enabled ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {alarm.time}
                </span>
                <span className={`font-headline text-lg font-bold ${alarm.enabled ? 'text-on-surface-variant' : 'text-on-surface-variant/50'}`}>
                  {alarm.period}
                </span>
              </div>
              <div className="flex gap-2 mt-1">
                {alarm.days.map(day => (
                  <span key={day} className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    alarm.enabled ? 'text-primary bg-primary/10' : 'text-zinc-300'
                  }`}>
                    {day}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1 text-on-surface-variant/60">
                <Bell size={14} />
                <span className="text-xs font-semibold tracking-wide">{alarm.sound}</span>
              </div>
            </div>
            <button 
              onClick={() => toggleAlarm(alarm.id)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${
                alarm.enabled ? 'bg-primary' : 'bg-surface-container-highest'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                alarm.enabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={onAdd}
        className="fixed bottom-28 right-6 w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform duration-300 ease-out z-50"
      >
        <Plus size={32} />
      </button>
    </div>
  );
}

function FeedScreen({ tasks, toggleTask, userName, visionImage, visionQuote }: { tasks: Task[], toggleTask: (id: string) => void, userName: string, visionImage: string, visionQuote: string }) {
  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto space-y-10">
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <Menu className="text-zinc-400 cursor-pointer" />
          <span className="text-xl font-extrabold text-orange-600 italic font-headline tracking-tight">Rise & Shine</span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high">
          <img src="https://picsum.photos/seed/alex/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      <section className="pt-4">
        <p className="font-body italic text-secondary text-lg mb-2">Good morning, {userName}.</p>
        <h2 className="font-headline font-extrabold text-4xl tracking-tight leading-none text-on-surface">
          Ready to find <br /> <span className="text-primary">your light</span> today?
        </h2>
      </section>

      {/* Vision Board Section */}
      <section className="space-y-4">
        <div className="flex items-end justify-between px-2">
          <h3 className="font-headline font-bold text-xl">Vision Board</h3>
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Your Goal</span>
        </div>
        <div className="relative h-48 rounded-lg overflow-hidden shadow-lg group">
          <img src={visionImage} alt="Vision Board" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-body italic text-lg leading-tight">
              {visionQuote}
            </p>
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="absolute -top-4 -right-2 bg-primary-container text-on-primary-container px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-10 shadow-lg shadow-primary/10">
          Daily Affirmation
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10">
            <Quote className="text-primary mb-4 fill-current" size={32} />
            <blockquote className="font-body text-3xl text-on-surface leading-snug">
              Today is a gift, and I am exactly where I need to be to grow.
            </blockquote>
            <div className="mt-6 flex items-center gap-2">
              <div className="h-[1px] w-8 bg-outline-variant"></div>
              <span className="text-outline text-sm font-medium">Mindful Reminder</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low rounded-lg p-6 flex flex-col justify-between aspect-square">
          <div className="flex items-center justify-between">
            <Flame className="text-secondary fill-current" size={24} />
            <span className="text-xs font-bold text-secondary-fixed-dim bg-secondary/10 px-2 py-0.5 rounded-full">LEVEL 4</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-4xl text-on-surface">12</h3>
            <p className="text-sm font-semibold text-outline">Day Streak</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-6 flex flex-col items-center justify-center aspect-square shadow-sm">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-surface-container-high" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="6"></circle>
              <circle 
                className="text-primary" 
                cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" 
                strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="62.8" strokeLinecap="round"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-on-surface">75%</span>
            </div>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-outline">Complete</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between px-2">
          <h3 className="font-headline font-bold text-xl">Morning Tasks</h3>
          <span className="text-sm font-semibold text-primary cursor-pointer">View All</span>
        </div>
        <div className="space-y-3">
          {tasks.map(task => (
            <div 
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className="flex items-center gap-4 p-5 bg-surface-container-lowest rounded-lg cursor-pointer group hover:bg-white transition-colors"
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                task.completed ? 'bg-primary border-primary' : 'border-outline-variant'
              }`}>
                {task.completed && <CheckCircle2 size={16} className="text-white" />}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-on-surface transition-all ${task.completed ? 'line-through text-outline' : ''}`}>
                  {task.text}
                </p>
                <p className="text-xs text-outline">{task.subtext}</p>
              </div>
              <div className="text-zinc-300">
                {task.icon === 'droplets' && <Droplets size={20} />}
                {task.icon === 'pen' && <PenLine size={20} />}
                {task.icon === 'wind' && <Wind size={20} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary-fixed text-on-secondary-fixed rounded-lg p-6 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 opacity-10">
          <Lightbulb size={120} />
        </div>
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} />
            <span className="font-bold text-[10px] uppercase tracking-widest">Morning Insight</span>
          </div>
          <p className="font-body text-xl font-medium leading-relaxed italic pr-12">
            "Exposure to natural light within 30 minutes of waking resets your circadian rhythm."
          </p>
          <div className="mt-2 text-xs font-bold opacity-60">— Wellness Guide</div>
        </div>
      </section>
    </div>
  );
}

function ProfileScreen({ userName, visionImage, visionQuote, setVisionImage, setVisionQuote }: { 
  userName: string, 
  visionImage: string, 
  visionQuote: string,
  setVisionImage: (val: string) => void,
  setVisionQuote: (val: string) => void
}) {
  const [isEditingVision, setIsEditingVision] = useState(false);

  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto space-y-10">
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <Menu className="text-zinc-400 cursor-pointer" />
          <span className="text-xl font-extrabold text-orange-600 italic font-headline tracking-tight">Rise & Shine</span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high">
          <img src="https://picsum.photos/seed/alex/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      <section className="relative">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="relative w-32 h-32 flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full blur-2xl opacity-20 scale-125"></div>
            <img 
              className="w-full h-full rounded-full object-cover relative z-10 border-4 border-surface-container-lowest editorial-shadow" 
              src="https://picsum.photos/seed/alex/200" 
              alt="Profile" 
            />
            <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center z-20 border-4 border-surface cursor-pointer">
              <PenLine size={18} />
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="font-headline text-4xl font-extrabold tracking-tight text-on-background mb-1">{userName}</h2>
            <p className="font-body text-xl italic text-on-surface-variant">Finding clarity in every sunrise.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold uppercase tracking-widest">Early Bird Gold</span>
              <span className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-widest">Member since 2023</span>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Board Settings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-headline text-lg font-bold text-on-surface-variant">Vision Board</h3>
          <button 
            onClick={() => setIsEditingVision(!isEditingVision)}
            className="text-sm font-bold text-primary uppercase tracking-widest"
          >
            {isEditingVision ? 'Done' : 'Edit'}
          </button>
        </div>
        
        <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-4">
          {isEditingVision ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-1">Goal Image URL</label>
                <input 
                  type="text" 
                  value={visionImage}
                  onChange={(e) => setVisionImage(e.target.value)}
                  placeholder="Paste image URL here..."
                  className="w-full bg-surface-container-low border-none rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-outline mt-1 italic">Example: LBSNAA, Dream Home, or Travel Destination</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-1">Motivation Quote</label>
                <input 
                  type="text" 
                  value={visionQuote}
                  onChange={(e) => setVisionQuote(e.target.value)}
                  placeholder="Enter your motivation..."
                  className="w-full bg-surface-container-low border-none rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setVisionImage('https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=1000&auto=format&fit=crop');
                    setVisionQuote('LBSNAA: The ultimate destination.');
                  }}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase"
                >
                  UPSC Preset
                </button>
                <button 
                  onClick={() => {
                    setVisionImage('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop');
                    setVisionQuote('Building my dream home, one day at a time.');
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase"
                >
                  Home Preset
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                <img src={visionImage} alt="Vision" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-headline font-bold text-on-surface">Your Vision</p>
                <p className="font-body italic text-sm text-on-surface-variant line-clamp-2">"{visionQuote}"</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-lg editorial-shadow flex flex-col justify-between aspect-square">
          <Flame className="text-primary fill-current" size={32} />
          <div>
            <div className="text-4xl font-headline font-black text-primary leading-none">12</div>
            <div className="text-sm font-label text-on-surface-variant font-semibold mt-1">Day Streak</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-lg editorial-shadow flex flex-col justify-between aspect-square">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-surface-container-high" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
              <circle className="text-secondary" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175.9" strokeDashoffset="44" strokeWidth="6"></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-secondary">75%</div>
          </div>
          <div>
            <div className="text-4xl font-headline font-black text-secondary leading-none">Tasks</div>
            <div className="text-sm font-label text-on-surface-variant font-semibold mt-1">Completion rate</div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-on-surface-variant px-2">Settings & Preferences</h3>
        <div className="bg-surface-container-low rounded-lg overflow-hidden">
          <SettingsItem icon={<Bell />} title="Notification preferences" subtitle="Alerts, sounds, and banners" color="bg-primary-fixed" textColor="text-primary" />
          <SettingsItem icon={<Moon />} title="Theme" subtitle="Light / Dark" color="bg-secondary-fixed" textColor="text-secondary" />
          <SettingsItem icon={<Smartphone />} title="Connected devices" subtitle="Smart watch & speakers" color="bg-tertiary-fixed" textColor="text-tertiary" />
          <SettingsItem icon={<Info />} title="About" subtitle="Version 2.4.0 (Aura)" color="bg-surface-container-high" textColor="text-on-surface-variant" />
        </div>
      </section>

      <section className="pt-8 pb-12">
        <div className="relative">
          <span className="absolute -top-6 -left-2 text-7xl font-body text-primary-container opacity-30 leading-none">“</span>
          <p className="font-body text-2xl italic leading-relaxed text-on-surface relative z-10 pl-6">
            The way you start your day determines the way you live your life. Keep shining, {userName}.
          </p>
        </div>
      </section>

      <button className="w-full py-4 rounded-md bg-surface-container-low text-error font-headline font-bold hover:bg-error-container/30 transition-all flex items-center justify-center gap-2 mb-10">
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
}

function SettingsItem({ icon, title, subtitle, color, textColor }: { icon: React.ReactNode, title: string, subtitle: string, color: string, textColor: string }) {
  return (
    <div className="flex items-center justify-between p-5 bg-surface-container-lowest hover:bg-orange-50 transition-colors cursor-pointer group mt-[2px]">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center ${textColor} group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        <div>
          <p className="font-headline font-bold text-on-surface">{title}</p>
          <p className="text-xs text-on-surface-variant font-medium">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="text-on-surface-variant opacity-30" size={20} />
    </div>
  );
}

function NewAlarmScreen({ onSave, onClose }: { onSave: () => void, onClose: () => void }) {
  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto space-y-10 min-h-screen bg-background">
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
        <button onClick={onClose} className="text-orange-600 hover:opacity-80 transition-opacity">
          <X size={24} />
        </button>
        <h1 className="font-headline font-bold tracking-tight text-xl italic text-orange-600">Rise & Shine</h1>
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <img src="https://picsum.photos/seed/alex/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      <section className="text-center space-y-2">
        <p className="font-body text-xl italic text-outline">What time shall we wake?</p>
        <h2 className="font-headline font-extrabold text-4xl tracking-tight text-on-surface">New Alarm</h2>
      </section>

      <section className="flex justify-center items-center space-x-4 py-8 relative">
        <div className="absolute inset-x-0 h-24 top-1/2 -translate-y-1/2 bg-surface-container-low/50 rounded-lg -z-10"></div>
        <div className="flex flex-col items-center">
          <span className="text-zinc-300 font-headline font-bold text-4xl opacity-40">05</span>
          <span className="text-on-surface font-headline font-extrabold text-7xl tracking-tighter">06</span>
          <span className="text-zinc-300 font-headline font-bold text-4xl opacity-40">07</span>
        </div>
        <span className="text-primary font-headline font-extrabold text-6xl pb-2">:</span>
        <div className="flex flex-col items-center">
          <span className="text-zinc-300 font-headline font-bold text-4xl opacity-40">29</span>
          <span className="text-on-surface font-headline font-extrabold text-7xl tracking-tighter">30</span>
          <span className="text-zinc-300 font-headline font-bold text-4xl opacity-40">31</span>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <button className="px-4 py-2 rounded-full bg-primary text-on-primary font-label font-bold text-sm shadow-sm">AM</button>
          <button className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant font-label font-bold text-sm">PM</button>
        </div>
      </section>

      <section className="space-y-4">
        <label className="font-label font-semibold text-sm uppercase tracking-widest text-outline px-1">Repeat On</label>
        <div className="flex justify-between items-center gap-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <button 
              key={i} 
              className={`w-11 h-11 rounded-full flex items-center justify-center font-label font-bold text-xs transition-all ${
                i > 0 && i < 5 ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <label className="font-label font-semibold text-sm uppercase tracking-widest text-outline">Wake-up Focus</label>
          <span className="font-body italic text-sm text-primary">Changes visual theme</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FocusCard icon={<Briefcase />} label="Career" active image="https://picsum.photos/seed/office/200" />
          <FocusCard icon={<Heart />} label="Wellness" image="https://picsum.photos/seed/yoga/200" />
          <FocusCard icon={<Palette />} label="Creativity" image="https://picsum.photos/seed/art/200" />
        </div>
      </section>

      <section className="space-y-4">
        <label className="font-label font-semibold text-sm uppercase tracking-widest text-outline px-1">Alarm Sound</label>
        <div className="bg-surface-container-lowest rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
              <Music size={20} />
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface">Morning Forest Mist</p>
              <p className="font-label text-xs text-outline">Gentle birds & soft piano</p>
            </div>
          </div>
          <ChevronRight className="text-primary" />
        </div>
      </section>

      <section className="pt-6 pb-12">
        <button 
          onClick={onSave}
          className="w-full bg-primary text-on-primary font-headline font-bold py-5 rounded-lg text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
        >
          <span>Save Alarm</span>
          <CheckCircle2 size={20} />
        </button>
        <p className="text-center mt-6 font-body italic text-outline">Wake up in 7 hours and 30 minutes</p>
      </section>
    </div>
  );
}

function FocusCard({ icon, label, active, image }: { icon: React.ReactNode, label: string, active?: boolean, image: string }) {
  return (
    <button className={`group relative aspect-square rounded-lg overflow-hidden flex flex-col items-center justify-center border-2 transition-all ${
      active ? 'border-primary' : 'border-transparent'
    }`}>
      <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-500" />
      <div className={`absolute inset-0 ${active ? 'bg-primary/20' : 'bg-black/10'}`}></div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-white mb-1">{icon}</div>
        <span className="font-label font-bold text-xs text-white">{label}</span>
      </div>
    </button>
  );
}

function WakeUpScreen({ onDismiss, visionImage }: { onDismiss: () => void, visionImage: string }) {
  return (
    <div className="fixed inset-0 z-[100] bg-background text-on-background font-body overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img 
          src={visionImage} 
          alt="Vision" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      </div>

      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-8 h-20">
        <div className="flex items-center gap-2">
          <Sun className="text-white" size={24} />
          <span className="font-headline font-bold text-xl tracking-tight text-white italic">Rise & Shine</span>
        </div>
        <span className="font-headline text-white/80 text-sm font-semibold tracking-widest uppercase">72° Clear</span>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-between h-screen w-full pt-32 pb-24 px-6">
        <div className="text-center flex flex-col items-center">
          <p className="font-label text-white/90 text-sm font-semibold tracking-[0.3em] uppercase mb-4">Monday, May 12</p>
          <h1 className="font-headline font-extrabold text-[120px] leading-none text-white text-glow tracking-tighter">
            06:30
          </h1>
          <div className="mt-8 px-8 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
            <p className="font-body italic text-white text-lg md:text-xl">
              "The sun is a daily reminder that we too can rise again."
            </p>
          </div>
        </div>

        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <button 
            onClick={onDismiss}
            className="w-full py-6 bg-primary text-on-primary font-headline font-bold text-xl rounded-full aura-glow active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <AlarmClock className="transition-transform group-hover:rotate-12" />
            Dismiss Alarm
          </button>
          <button className="w-3/4 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white font-headline font-semibold text-lg rounded-full active:scale-90 transition-all duration-300 border border-white/10">
            Snooze · 9m
          </button>
          
          <div className="mt-8 flex gap-4 w-full">
            <InsightItem icon={<Sun size={20} />} label="Sunlight" value="14:02" />
            <InsightItem icon={<Moon size={20} />} label="Sleep" value="7h 45m" />
            <InsightItem icon={<Droplets size={20} />} label="Hydrate" value="Start" />
          </div>
        </div>
      </main>
      <div className="fixed bottom-[-10%] left-1/2 -translate-x-1/2 w-[120%] aspect-square rounded-full bg-gradient-to-t from-primary/30 to-transparent blur-[120px] pointer-events-none -z-10"></div>
    </div>
  );
}

function InsightItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-lg flex flex-col items-center justify-center border border-white/10">
      <div className="mb-1 text-white/80">{icon}</div>
      <span className="font-label text-[10px] text-white/60 uppercase tracking-widest">{label}</span>
      <span className="font-headline text-white font-bold">{value}</span>
    </div>
  );
}

function MotivateScreen({ onSave }: { onSave: () => void }) {
  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto w-full min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <Menu className="text-zinc-400 cursor-pointer" />
          <span className="text-xl font-extrabold text-orange-600 italic font-headline tracking-tight">Rise & Shine</span>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high">
          <img src="https://picsum.photos/seed/alex/100" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </header>

      <section className="mb-10 mt-4">
        <h2 className="font-headline text-4xl font-bold text-on-background tracking-tight leading-tight">
          What fuels your <br /> <span className="text-primary">spirit today?</span>
        </h2>
        <p className="font-body text-xl text-on-surface-variant italic mt-3 leading-relaxed">
          Choose a focus for your daily wisdom and morning reflections.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MotivateCard icon={<Briefcase />} title="Career" description="Ambition, focus, and professional growth strategies." />
        <MotivateCard icon={<Flower2 />} title="Wellness" description="Vibrant health, physical energy, and holistic balance." active />
        <MotivateCard icon={<Palette />} title="Creativity" description="Unlocking imagination and expressive morning flow." />
        <MotivateCard icon={<Heart />} title="Mindfulness" description="Inner peace, presence, and intentional awareness." />
      </div>

      <div className="mt-12 mb-8 text-center px-4">
        <Quote className="text-outline-variant opacity-40 mx-auto mb-2" size={32} />
        <p className="font-body italic text-lg text-on-surface-variant max-w-md mx-auto">
          "The sun is a daily reminder that we too can rise again from the darkness, that we too can shine our own light."
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <button 
          onClick={onSave}
          className="bg-primary text-on-primary font-headline font-bold px-12 py-4 rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Save Selection
        </button>
      </div>
    </div>
  );
}

function MotivateCard({ icon, title, description, active }: { icon: React.ReactNode, title: string, description: string, active?: boolean }) {
  return (
    <div className={`group relative p-6 rounded-lg transition-all duration-300 cursor-pointer ring-1 ${
      active 
        ? 'bg-primary-container/20 shadow-md ring-primary/20' 
        : 'bg-surface-container-lowest hover:shadow-xl hover:shadow-primary/5 ring-outline-variant/15'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
        active ? 'bg-primary text-on-primary' : 'bg-orange-100 text-primary'
      }`}>
        {icon}
      </div>
      <h3 className="font-headline font-bold text-xl text-on-background mb-1">{title}</h3>
      <p className="font-body text-on-surface-variant leading-snug">{description}</p>
      {active && (
        <div className="absolute top-4 right-4 text-primary">
          <CheckCircle2 size={24} className="fill-current" />
        </div>
      )}
    </div>
  );
}
