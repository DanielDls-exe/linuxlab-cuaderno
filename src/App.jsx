import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Command, Download, Flag, FolderOpen, Home, LayoutList, Lightbulb, LockKeyhole, Menu, RotateCcw, Search, ShieldCheck, Terminal as TerminalIcon, TrendingUp, X } from 'lucide-react';
import { CURRICULUM, DIAGNOSTICO_QUESTIONS, EXTRA_GLOSSARY, GLOSARIO_DATA, ROUTES, createBaseVFS } from './data/curriculum.js';
import { confirmAction, executeBashLine } from './lib/shell.js';
import { assess, practicedCommands } from './lib/assessment.js';
import RichText from './components/RichText.jsx';
import Terminal from './components/Terminal.jsx';
import FileTree from './components/FileTree.jsx';
import './styles.css';

const STORAGE = 'linuxlab_learning_v2';
const EMPTY_PROGRESS = { completed: [], commands: [], diagnosis: null, lastActivity: '0.1', assistance: {} };
const PRACTICES = CURRICULUM.filter(item => item.tipo !== 'diagnostico');
const GLOSSARY = [...GLOSARIO_DATA, ...EXTRA_GLOSSARY];
const LESSON_TITLES = { '0.1': 'Tu primera línea', '1.1': '¿Dónde estoy?', '1.2': 'Moverse por el árbol', '1.3': 'Mirar alrededor', '1.4': 'Leer entre archivos', reto1: 'La búsqueda del tesoro', '2.1': 'Un espacio para crear', '2.2': 'Copiar no es mover', '2.3': 'Borrar con intención', '2.4': 'Muchos archivos, una línea', reto2: 'Ordena tus descargas', '3.1': 'El radar de archivos', '3.2': 'Encuentra la señal', '3.3': 'Conecta las piezas', '3.4': 'Guarda lo que encontraste', reto3: 'Tras el rastro del intruso' };
const titleOf = activity => LESSON_TITLES[activity.id] || activity.titulo;

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE));
    if (!value || !Array.isArray(value.completed) || !Array.isArray(value.commands)) return EMPTY_PROGRESS;
    return { ...EMPTY_PROGRESS, ...value, completed: value.completed.filter(id => PRACTICES.some(item => item.id === id)), commands: value.commands.filter(command => typeof command === 'string'), assistance: value.assistance && typeof value.assistance === 'object' ? value.assistance : {} };
  } catch { return EMPTY_PROGRESS; }
}

function newSession(activity) {
  const cwd = activity.initialCwd || '/home/ana';
  return { id: `${activity.id}-${Date.now()}`, activityId: activity.id, vfs: createBaseVFS(activity.vfsPreset), cwd, prevCwd: cwd, events: [], lines: [], pendingAction: null, pager: null, pagerId: 0, hints: 0, revealed: false };
}

function LabDrawing() {
  return <div className="lab-drawing" aria-label="De una idea a un comando: un pequeño mapa de carpetas" role="img">
    <div className="drawing-caption"><span>FIG. 01</span><span>APRENDER ES EXPLORAR</span></div>
    <svg viewBox="0 0 480 320" aria-hidden="true"><defs><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".17" /></pattern></defs>
      <rect width="480" height="320" fill="url(#dots)" /><path d="M91 93v80h108m-108 0v81h207m-99-81v81" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" opacity=".5" />
      <g transform="translate(56 45)"><path d="M0 10h27l10 11h49v49H0z" fill="#e8ad73" stroke="#3b3a32" strokeWidth="1.5" /><path d="M0 26h86" stroke="#3b3a32" strokeWidth="1.5" /><text x="12" y="51" fontSize="13" fontFamily="monospace">/home/ana</text></g>
      <g transform="translate(165 139)"><path d="M0 8h21l8 9h50v44H0z" fill="#f0eee5" stroke="#3b3a32" strokeWidth="1.5" /><text x="13" y="42" fontSize="13" fontFamily="monospace">docs/</text></g>
      <g transform="translate(272 222) rotate(-5)"><path d="M0 0h69l13 14v69H0z" fill="#faf8f1" stroke="#3b3a32" strokeWidth="1.5" /><path d="M69 0v14h13M14 30h46M14 40h36M14 50h41" fill="none" stroke="#3b3a32" opacity=".55" /><text x="9" y="70" fontSize="9" fontFamily="monospace">pista.txt</text></g>
      <g transform="translate(187 38) rotate(3)"><rect width="231" height="81" rx="3" fill="#252a25" /><circle cx="13" cy="12" r="2.5" fill="#a4b59a" /><text x="15" y="37" fill="#a4b59a" fontFamily="monospace" fontSize="11">ana@linuxlab ~ $</text><text x="15" y="58" fill="#fffaf0" fontFamily="monospace" fontSize="17">cd docs</text><rect x="89" y="45" width="8" height="16" fill="#e8ad73" /></g>
      <path d="M372 154c24 2 36 17 36 36" fill="none" stroke="#b25535" strokeWidth="1.5" /><path d="m402 181 6 9 7-7" fill="none" stroke="#b25535" strokeWidth="1.5" /><text x="324" y="151" fontSize="13" fontStyle="italic" fill="#b25535" fontFamily="Georgia,serif">prueba y observa</text>
      <circle cx="94" cy="256" r="25" fill="none" stroke="#b25535" strokeWidth="1.5" /><path d="m83 256 7 7 15-16" fill="none" stroke="#b25535" strokeWidth="2" />
    </svg><div className="drawing-footer"><span>Una idea.</span><span>Un comando.</span><span>Algo cambia.</span></div>
  </div>;
}

function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const listener = event => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const elements = [...(ref.current?.querySelectorAll('button:not(:disabled), input, a[href], [tabindex="0"]') || [])];
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', listener);
    return () => { document.removeEventListener('keydown', listener); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Cerrar diálogo" onClick={onClose}><X size={20} /></button></div>{children}</section></div>;
}

export default function App() {
  const [progress, setProgress] = useState(readProgress);
  const [screen, setScreen] = useState('home'), [mobileNav, setMobileNav] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 960px)').matches);
  const [session, setSession] = useState(() => newSession(CURRICULUM.find(item => item.id === progress.lastActivity && item.tipo !== 'diagnostico') || CURRICULUM[0]));
  const [inserted, setInserted] = useState(null), [freeMode, setFreeMode] = useState(false), [reset, setReset] = useState(null);
  const [glossaryQuery, setGlossaryQuery] = useState(''), [glossaryCategory, setGlossaryCategory] = useState('Todas');
  const [answers, setAnswers] = useState({}), [diagnosticSubmitted, setDiagnosticSubmitted] = useState(false), [summaryRoute, setSummaryRoute] = useState('ruta1');
  const [notice, setNotice] = useState('');
  const pageHeading = useRef(null);
  const navClose = useRef(null);
  const activity = CURRICULUM.find(item => item.id === session.activityId) || CURRICULUM[0];
  const evaluation = useMemo(() => assess(activity, session), [activity, session]);
  const percent = Math.round(progress.completed.length / PRACTICES.length * 100);
  const routeCount = route => CURRICULUM.filter(item => item.rutaId === route && progress.completed.includes(item.id)).length;
  const canOpen = id => {
    if (freeMode || progress.completed.includes(id) || id === '0.1' || id === '1.1') return true;
    const item = CURRICULUM.find(item => item.id === id);
    const route = CURRICULUM.filter(entry => entry.rutaId === item?.rutaId && entry.tipo !== 'diagnostico');
    const index = route.findIndex(entry => entry.id === id);
    if (index > 0) return progress.completed.includes(route[index - 1].id);
    return id === '2.1' ? progress.completed.includes('reto1') || (progress.diagnosis?.score / progress.diagnosis?.total >= .8) : id === '3.1' ? progress.completed.includes('reto2') : false;
  };
  const nextActivity = PRACTICES.find(item => !progress.completed.includes(item.id) && canOpen(item.id)) || PRACTICES[0];
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(progress)); } catch { setNotice('El navegador no pudo guardar el progreso. Puedes seguir practicando en esta sesión.'); } }, [progress]);
  useEffect(() => { const media = window.matchMedia('(max-width: 960px)'); const update = () => setIsMobile(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => {
    if (!mobileNav || !isMobile) return;
    const previous = document.activeElement;
    navClose.current?.focus();
    const closeOnEscape = event => { if (event.key === 'Escape') setMobileNav(false); };
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('keydown', closeOnEscape); previous?.focus(); };
  }, [mobileNav, isMobile]);
  useEffect(() => { document.title = `LinuxLab · ${screen === 'lesson' ? titleOf(activity) : { home: 'Una línea a la vez', routes: 'Rutas', glossary: 'Manual', progress: 'Tu progreso', diagnostic: 'Punto de partida', summary: 'Ruta completada' }[screen]}`; window.scrollTo({ top: 0, left: 0 }); if (screen === 'lesson' && inserted) document.getElementById('terminal-command')?.focus(); else pageHeading.current?.focus({ preventScroll: true }); }, [screen, activity.id]);

  function navigate(destination) { setScreen(destination); setMobileNav(false); setNotice(''); }
  function openActivity(id) {
    if (!canOpen(id)) return;
    const item = CURRICULUM.find(item => item.id === id);
    if (!item) return;
    if (item.tipo === 'diagnostico') { startDiagnostic(); return; }
    if (session.activityId !== id) setSession(newSession(item));
    setProgress(previous => ({ ...previous, lastActivity: id })); setInserted(null); navigate('lesson');
  }
  function recordCompletion(next) {
    const checked = assess(activity, next);
    setProgress(previous => {
      const completed = checked.complete && !previous.completed.includes(activity.id) ? [...previous.completed, activity.id] : previous.completed;
      return { ...previous, completed, commands: [...new Set([...previous.commands, ...practicedCommands(next.events)])], assistance: checked.complete ? { ...previous.assistance, [activity.id]: next.revealed ? 'solution' : next.hints > 0 ? 'hints' : 'independent' } : previous.assistance };
    });
  }
  function runCommand(line) {
    if (!line.trim() && !session.pendingAction) return;
    const response = session.pendingAction ? confirmAction(session, session.pendingAction, /^(s|si|sí|y)$/i.test(line.trim())) : executeBashLine(line, session);
    const next = { ...session, vfs: response.vfs, cwd: response.cwd, prevCwd: response.prevCwd, pendingAction: response.pendingAction, events: [...session.events, ...response.events], lines: response.clearScreen ? [] : [...session.lines, { command: line, cwd: session.cwd, output: response.pager !== undefined && response.pager !== null ? '(Archivo abierto en el visor less.)' : response.output, status: response.status }], pager: response.pager ?? null, pagerId: session.pagerId + 1 };
    setSession(next); recordCompletion(next);
  }
  function finishActivity() {
    if (!evaluation.complete) return;
    if (activity.tipo === 'reto') { setSummaryRoute(activity.rutaId); navigate('summary'); return; }
    if (activity.id === '0.1') { startDiagnostic(); return; }
    const currentIndex = PRACTICES.findIndex(item => item.id === activity.id);
    const next = PRACTICES[currentIndex + 1]; if (next) openActivity(next.id); else navigate('routes');
  }
  function startDiagnostic() { setAnswers({}); setDiagnosticSubmitted(false); navigate('diagnostic'); }
  function gradeDiagnostic() {
    const score = DIAGNOSTICO_QUESTIONS.filter(question => question.opciones.find(option => option.correcta)?.id === answers[question.id]).length;
    setProgress(previous => ({ ...previous, diagnosis: { score, total: DIAGNOSTICO_QUESTIONS.length } })); setDiagnosticSubmitted(true);
  }
  function downloadNotes(routeId) {
    const route = ROUTES.find(route => route.id === routeId);
    const entries = GLOSSARY.filter(entry => entry.categoria.startsWith(`Ruta ${route.number.replace(/^0/, '')}`));
    const content = `# LinuxLab — ${route.name}\n\n${entries.map(entry => `## ${entry.cmd}\n${entry.descripcion}\n\nUso: ${entry.sintaxis}\nEjemplo: ${entry.ejemplo}\n`).join('\n')}\nRecuerda: este laboratorio es una simulación. En una terminal real rm no pide confirmación salvo que lo configures o uses -i.\n`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `linuxlab-ruta-${route.number}.md`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function insert(text) { setInserted({ text, id: Date.now() }); }
  const screenLabels = { home: 'Inicio', routes: 'Rutas de aprendizaje', lesson: activity.codigo, glossary: 'Manual de bolsillo', progress: 'Mi progreso', diagnostic: 'Punto de partida', summary: 'Una ruta más' };
  const nav = [{ id: 'home', label: 'Inicio', icon: Home }, { id: 'routes', label: 'Rutas de aprendizaje', icon: LayoutList }, { id: 'glossary', label: 'Manual de bolsillo', icon: BookOpen }, { id: 'progress', label: 'Mi progreso', icon: TrendingUp }];
  const score = DIAGNOSTICO_QUESTIONS.filter(question => question.opciones.find(option => option.correcta)?.id === answers[question.id]).length;

  return <div className="app-shell">
    <a className="skip-link" href="#main">Ir al contenido</a>
    {mobileNav && <button className="sidebar-scrim" aria-label="Cerrar navegación" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`} inert={isMobile && !mobileNav ? true : undefined} role={isMobile ? 'dialog' : undefined} aria-modal={isMobile && mobileNav ? true : undefined} aria-label="Navegación del cuaderno" onKeyDown={event => { if (!isMobile || !mobileNav || event.key !== 'Tab') return; const buttons = [...event.currentTarget.querySelectorAll('button')]; if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); } }}>
      <button className="sidebar-close icon-button" ref={navClose} aria-label="Cerrar navegación" onClick={() => setMobileNav(false)}><X size={20} /></button>
      <button className="brand" onClick={() => navigate('home')} aria-label="LinuxLab, inicio"><span className="brand-mark">l<span>_</span></span><span>linuxlab<span className="brand-dot">.</span></span></button>
      <div className="sidebar-edition"><span>CUADERNO DE PRÁCTICAS</span><span>VOL. 01 / LINUX</span></div>
      <nav aria-label="Navegación principal">{nav.map(({ id, label, icon: Icon }, index) => <button key={id} className={`nav-item ${screen === id || id === 'routes' && ['lesson', 'summary', 'diagnostic'].includes(screen) ? 'active' : ''}`} aria-current={screen === id || id === 'routes' && ['lesson', 'summary', 'diagnostic'].includes(screen) ? 'page' : undefined} onClick={() => navigate(id)}><Icon size={17} strokeWidth={1.6} /><span>{label}</span><small>0{index + 1}</small></button>)}</nav>
      <div className="sidebar-progress"><div><span>Tu recorrido</span><strong>{percent}%</strong></div><div className="progress-track"><i style={{ width: `${percent}%` }} /></div><p>{progress.completed.length} de {PRACTICES.length} prácticas completadas</p></div>
      <div className="sidebar-bottom"><span className="sidebar-note-mark">↳</span><p>Equivocarse también<br />es parte del camino.</p><span className="sidebar-safety"><ShieldCheck size={13} />Todo ocurre en el navegador.</span></div>
    </aside>
    <div className="workspace" inert={isMobile && mobileNav ? true : undefined}>
      <header className="topbar"><div><button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)} aria-label="Abrir navegación" aria-expanded={mobileNav}><Menu size={21} /></button><span className="breadcrumb-root">Tu cuaderno</span><span className="breadcrumb-slash">/</span><span>{screenLabels[screen]}</span></div><span className="topbar-note"><span className="status-dot" />A tu ritmo. Sin riesgo.</span></header>
      <main id="main" tabIndex={-1} className={`main-content screen-${screen}`}>
        {notice && <div className="notice" role="status">{notice}</div>}
        {screen === 'home' && <>
          <section className="home-hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />UN LABORATORIO PARA EMPEZAR</div><h1 ref={pageHeading} tabIndex={-1}>Una línea<br />a la <em>vez.</em></h1><p className="hero-description">La terminal no muerde. Aprende a conversar con Linux explorando, probando y equivocándote en un lugar seguro.</p><div className="hero-actions"><button className="button primary" onClick={() => openActivity(progress.completed.length ? progress.lastActivity : '0.1')}>{progress.completed.length ? 'Retomar mi práctica' : 'Abrir el laboratorio'}<ArrowUpRight size={18} /></button><button className="text-button" onClick={startDiagnostic}>Ya conozco lo básico<ArrowRight size={15} /></button></div><div className="hero-footnote"><ShieldCheck size={15} /><span>Tus archivos reales están a salvo. Aquí todo es virtual.</span></div></div><LabDrawing /></section>
          <section className="routes-preview"><div className="section-heading"><div><span className="eyebrow">EL RECORRIDO</span><h2>Tres rutas. Un poco más de autonomía.</h2></div><span className="section-meta">12 LECCIONES + 3 RETOS</span></div>
            {ROUTES.map(route => <button key={route.id} className={`route-row ${route.color}`} onClick={() => { navigate('routes'); }}><span className="route-number">{route.number}</span><span className="route-row-copy"><span className="route-name">{route.name}</span><strong>{route.title}</strong><span className="route-description">{route.description}</span></span><span className="command-list">{route.commands.map(command => <code key={command}>{command}</code>)}</span><span className="route-row-end"><small>{routeCount(route.id)}/5</small><ArrowUpRight size={21} strokeWidth={1.5} /></span></button>)}
          </section><div className="home-bottom"><span><Command size={16} />Aprender haciendo, desde el primer comando.</span><button className="text-button" onClick={() => navigate('glossary')}>¿Un comando te suena a chino? Abre el manual<ArrowRight size={14} /></button></div>
        </>}

        {screen === 'routes' && <>
          <div className="page-intro"><div><span className="eyebrow">DE MENOS A MÁS</span><h1 ref={pageHeading} tabIndex={-1}>Tu mapa de <em>ruta.</em></h1><p>Una práctica pequeña. Un concepto nuevo. Sigue el orden o repasa lo que ya conoces.</p></div><button className={`mode-toggle ${freeMode ? 'enabled' : ''}`} onClick={() => setFreeMode(!freeMode)} aria-pressed={freeMode}><span className="toggle-track"><i /></span>Explorar en cualquier orden</button></div>
          {freeMode && <p className="inline-note">Puedes abrir cualquier práctica. Para completarla, tendrás que cumplir sus objetivos.</p>}
          <div className="intro-strip"><span className="intro-symbol">&gt;_</span><div><span className="eyebrow">ANTES DE EMPEZAR</span><strong>Conoce tu nueva herramienta.</strong><p>Qué es la terminal y cómo escribir tu primer comando.</p></div><button className="button secondary" onClick={() => openActivity('0.1')}>Introducción<ArrowRight size={15} /></button><button className="text-button" onClick={startDiagnostic}>Hacer diagnóstico</button></div>
          <div className="route-map">{ROUTES.map(route => <section key={route.id} className={`route-section ${route.color}`}><div className="route-section-head"><span className="route-number">{route.number}</span><div><span className="eyebrow">{route.name}</span><h2>{route.title}</h2><p>{route.description}</p></div><span className="route-fraction">{routeCount(route.id)}<span>/5</span></span></div><div className="lesson-list">{CURRICULUM.filter(item => item.rutaId === route.id).map(item => {
            const done = progress.completed.includes(item.id), unlocked = canOpen(item.id);
            return <button key={item.id} className={`lesson-row ${item.tipo === 'reto' ? 'challenge-row' : ''} ${done ? 'done' : ''}`} disabled={!unlocked} onClick={() => openActivity(item.id)}><span className="lesson-marker">{done ? <Check size={15} /> : !unlocked ? <LockKeyhole size={13} /> : item.tipo === 'reto' ? <Flag size={16} /> : <span />}</span><span className="lesson-code">{item.tipo === 'reto' ? 'RETO' : item.id}</span><span className="lesson-title">{titleOf(item)}</span><span className="lesson-meta">{done ? 'Completada' : item.tipo === 'reto' ? 'Integra lo aprendido' : '5–10 min'}</span>{unlocked && <ArrowRight size={16} />}</button>;
          })}</div></section>)}</div>
        </>}

        {screen === 'lesson' && <>
          <div className="lesson-heading"><div><button className="back-link" onClick={() => navigate('routes')}><ChevronLeft size={15} />Mapa de rutas</button><div className="lesson-heading-line"><span className="eyebrow">{activity.tipo === 'reto' ? `RETO / RUTA ${activity.rutaId.slice(-1)}` : activity.codigo}</span><span className="lesson-duration">{activity.tipo === 'reto' ? 'Sin tiempo límite' : 'Una idea para practicar'}</span></div><h1 ref={pageHeading} tabIndex={-1}>{titleOf(activity)}<span className="title-period">.</span></h1></div><span className={`completion-label ${evaluation.complete ? 'is-complete' : ''}`}>{evaluation.complete ? <Check size={14} /> : <span className="status-dot" />}{evaluation.complete ? 'Objetivo cumplido' : 'En práctica'}</span></div>
          <div className="lesson-layout"><div className="lesson-paper"><div className="paper-heading"><BookOpen size={16} /><span>{activity.tipo === 'reto' ? 'LA MISIÓN' : 'ANTES DE ESCRIBIR'}</span><small>{activity.id.startsWith('reto') ? 'RETO' : activity.id}</small></div>
            <div className="lesson-prose">{(activity.parrafos || [activity.escenario]).map((text, index) => <p key={index}><RichText text={text} /></p>)}</div>
            {activity.analogia && <aside className="analogy"><span>PIÉNSALO ASÍ</span><p><RichText text={activity.analogia} /></p></aside>}
            {activity.ejemploCmd && <div className="example-block"><span className="eyebrow">PRUEBA ESTE EJEMPLO</span><button onClick={() => insert(activity.ejemploCmd)} title="Escribir el ejemplo sin ejecutarlo"><code><span>$</span> {activity.ejemploCmd}</code><ArrowUpRight size={16} /></button><small>Lo escribimos por ti. Tú decides cuándo ejecutarlo.</small></div>}
            <div className="objective-block"><div><Flag size={16} /><span>TU OBJETIVO</span></div><p><RichText text={activity.objetivoTexto || activity.escenario} /></p><ul className="objective-list">{evaluation.results.map((result, index) => <li key={index} className={result.done ? 'done' : ''}><span>{result.done ? <Check size={12} /> : null}</span><span>{result.label}</span></li>)}</ul></div>
            <div className="help-block"><div><Lightbulb size={15} /><span>Un empujón, si lo necesitas.</span></div><div className="help-actions"><button className="text-button" disabled={session.hints >= 3} onClick={() => setSession(current => ({ ...current, hints: Math.min(3, current.hints + 1) }))}>{session.hints >= 3 ? 'Todas las pistas visibles' : `Pista ${session.hints + 1} de 3`}<ChevronDown size={13} /></button><button className="text-button muted" onClick={() => setSession(current => ({ ...current, revealed: true, hints: 3 }))}>Ver solución</button></div>
              {session.hints > 0 && <ol className="hint-list">{(activity.pistas || activity.pistasReto || []).slice(0, session.hints).map((text, index) => <li key={index}><RichText text={text} /></li>)}</ol>}
              {session.revealed && <p className="solution-note">Puedes seguir esta guía paso a paso. La actividad quedará registrada como completada con ayuda de la solución.</p>}
            </div>
          </div><div className="practice-column"><Terminal session={session} onCommand={runCommand} onReset={() => setReset('environment')} inserted={inserted} onInserted={() => setInserted(null)} /><FileTree key={session.id} vfs={session.vfs} cwd={session.cwd} /><p className="simulation-note"><CircleHelp size={13} /><span>Esto es un simulador de Linux. El modo seguro pide confirmación antes de usar rm; una terminal real puede no hacerlo.</span></p></div></div>
          <div className={`lesson-bottom ${evaluation.complete ? 'complete' : ''}`}><div>{evaluation.complete ? <Check size={20} /> : <TerminalIcon size={19} />}<span><strong>{evaluation.complete ? 'Una práctica más en tu cuaderno.' : session.lines.at(-1)?.status === 'error' ? 'Revisa el mensaje de la terminal e inténtalo otra vez.' : 'Tu siguiente paso está en la terminal.'}</strong><small>{evaluation.complete ? session.hints || session.revealed ? 'Completada con ayuda. Puedes repetirla a tu ritmo.' : 'Resuelta sin abrir pistas ni solución.' : `${evaluation.results.filter(item => item.done).length} de ${evaluation.results.length} objetivos cumplidos. Equivocarte no resta puntos.`}</small></span></div><div className="lesson-bottom-actions"><button className="text-button" onClick={() => navigate('glossary')}>Consultar manual<BookOpen size={15} /></button><button className="button primary" onClick={finishActivity} disabled={!evaluation.complete}>{activity.tipo === 'reto' ? 'Ver resultado' : 'Siguiente'}<ArrowRight size={16} /></button></div></div>
        </>}

        {screen === 'glossary' && <>
          <div className="page-intro"><div><span className="eyebrow">NO HACE FALTA MEMORIZARLO TODO</span><h1 ref={pageHeading} tabIndex={-1}>Tu manual de <em>bolsillo.</em></h1><p>Un comando, una explicación y algo con lo que empezar.</p></div><button className="button secondary" onClick={() => navigate('lesson')}><ChevronLeft size={15} />Volver a mi práctica</button></div>
          <div className="manual-tools"><label className="search-field"><Search size={18} /><span className="sr-only">Buscar comando o descripción</span><input value={glossaryQuery} onChange={event => setGlossaryQuery(event.target.value)} placeholder="Busca un comando o lo que necesitas hacer…" />{glossaryQuery && <button onClick={() => setGlossaryQuery('')} aria-label="Limpiar búsqueda"><X size={15} /></button>}</label><label className="manual-filter"><span className="sr-only">Filtrar por ruta</span><select value={glossaryCategory} onChange={event => setGlossaryCategory(event.target.value)}><option>Todas</option>{['Intro / Salida', 'Ruta 1 · Supervivencia', 'Ruta 2 · Manipulación', 'Ruta 3 · Búsqueda y flujo'].map(category => <option key={category}>{category}</option>)}</select></label></div>
          <div className="manual-list">{GLOSSARY.filter(entry => (glossaryCategory === 'Todas' || entry.categoria === glossaryCategory) && `${entry.cmd} ${entry.descripcion} ${entry.analogia}`.toLowerCase().includes(glossaryQuery.toLowerCase())).map(entry => <article className="manual-entry" key={entry.cmd}><div className="manual-command"><code>{entry.cmd}</code><span>{entry.categoria.replace('Ruta ', 'R')}</span></div><div className="manual-content"><p>{entry.descripcion}</p><code className="manual-syntax">{entry.sintaxis}</code><ul>{entry.opciones.map(option => <li key={option}>{option}</li>)}</ul><details><summary>Una forma de recordarlo</summary><p>{entry.analogia}</p></details></div><div className="manual-example"><span className="eyebrow">POR EJEMPLO</span><code>$ {entry.ejemplo}</code><button className="text-button" onClick={() => { navigate('lesson'); insert(entry.ejemplo); }}>Probar en mi terminal<ArrowUpRight size={14} /></button>{(entry.riesgo.includes('Precaución') || entry.riesgo.includes('Alto')) && <small className="risk-note">Revisa el destino antes de ejecutar.</small>}</div></article>)}</div>
          {!GLOSSARY.some(entry => (glossaryCategory === 'Todas' || entry.categoria === glossaryCategory) && `${entry.cmd} ${entry.descripcion} ${entry.analogia}`.toLowerCase().includes(glossaryQuery.toLowerCase())) && <div className="empty-state"><Search size={28} /><h2>No encontramos ese comando.</h2><p>Prueba con otra palabra, como «copiar», «archivos» o «buscar».</p><button className="text-button" onClick={() => { setGlossaryQuery(''); setGlossaryCategory('Todas'); }}>Ver todos los comandos<ArrowRight size={14} /></button></div>}
          <p className="inline-note">El laboratorio implementa un conjunto de comandos y opciones. Usa <code>comando --help</code> dentro de la terminal para consultar su ficha.</p>
        </>}

        {screen === 'progress' && <>
          <div className="page-intro"><div><span className="eyebrow">LO QUE YA RECORRISTE</span><h1 ref={pageHeading} tabIndex={-1}>Cada línea <em>cuenta.</em></h1><p>Este cuaderno guarda tus avances en este navegador. Vuelve cuando quieras.</p></div><button className="button primary" onClick={() => openActivity(nextActivity.id)}>Seguir practicando<ArrowRight size={16} /></button></div>
          <div className="progress-overview"><div className="progress-big"><span>{percent}<small>%</small></span><p>del recorrido completado</p></div><div className="progress-stats"><div><strong>{progress.completed.length}<small>/{PRACTICES.length}</small></strong><span>prácticas completadas</span></div><div><strong>{progress.commands.length}</strong><span>comandos y operadores practicados</span></div><div><strong>{ROUTES.filter(route => progress.completed.includes(`reto${route.number.slice(-1)}`)).length}<small>/3</small></strong><span>retos resueltos</span></div></div></div>
          <div className="section-heading"><h2>Las marcas del camino</h2><span className="section-meta">SIN PRISA, SIN PENALIZACIONES</span></div><div className="progress-routes">{ROUTES.map(route => <section key={route.id} className={`progress-route ${route.color} ${progress.completed.includes(`reto${route.number.slice(-1)}`) ? 'earned' : ''}`}><div className="badge-stamp"><span>LINUXLAB</span><strong>{route.number}</strong><span>{progress.completed.includes(`reto${route.number.slice(-1)}`) ? 'RETO RESUELTO' : 'EN EL CAMINO'}</span></div><div><h3>{route.name}</h3><p>{route.badge}</p><div className="progress-track"><i style={{ width: `${routeCount(route.id) * 20}%` }} /></div><span className="progress-route-count">{routeCount(route.id)} de 5 prácticas</span><button className="text-button" onClick={() => downloadNotes(route.id)}>Descargar notas de repaso<Download size={14} /></button></div></section>)}</div>
          <div className="progress-detail-grid"><section className="notebook-section"><span className="eyebrow">TU CAJA DE HERRAMIENTAS</span><h2>Comandos que ya probaste</h2><p>Haberlos practicado es el primer paso. La soltura llega al usarlos en situaciones distintas.</p><div className="practiced-commands">{progress.commands.length ? progress.commands.map(command => <code key={command}>{command}</code>) : <span>Tu primer comando te espera en el laboratorio.</span>}</div></section><section className="notebook-section"><span className="eyebrow">PUNTO DE PARTIDA</span><h2>{progress.diagnosis ? `${progress.diagnosis.score} de ${progress.diagnosis.total} aciertos` : 'Aún por descubrir'}</h2><p>El diagnóstico orienta tu recorrido. Puedes repetirlo para comprobar qué recuerdas.</p><button className="text-button" onClick={startDiagnostic}>{progress.diagnosis ? 'Repetir diagnóstico' : 'Hacer diagnóstico'}<ArrowRight size={14} /></button></section></div>
          {progress.completed.length > 0 && <details className="practice-history"><summary>Ver mis prácticas completadas y la ayuda utilizada</summary><ul>{PRACTICES.filter(item => progress.completed.includes(item.id)).map(item => <li key={item.id}><span>{item.codigo} · {titleOf(item)}</span><small>{progress.assistance[item.id] === 'solution' ? 'Con solución' : progress.assistance[item.id] === 'hints' ? 'Con pistas' : 'Sin pistas'}</small></li>)}</ul></details>}
          <button className="reset-link" onClick={() => setReset('progress')}><RotateCcw size={13} />Empezar un cuaderno nuevo</button>
        </>}

        {screen === 'diagnostic' && <>
          <div className="page-intro"><div><span className="eyebrow">ANTES DEL RECORRIDO</span><h1 ref={pageHeading} tabIndex={-1}>¿Desde dónde <em>partes?</em></h1><p>Cinco preguntas para orientarte. No es un examen y puedes empezar sin responderlas.</p></div><button className="text-button" onClick={() => openActivity('1.1')}>Omitir e ir a la Ruta 1<ArrowRight size={15} /></button></div>
          <div className="diagnostic-layout"><div className="question-list">{DIAGNOSTICO_QUESTIONS.map((question, index) => <fieldset key={question.id} className="question" disabled={diagnosticSubmitted}><legend><span>{String(index + 1).padStart(2, '0')}</span><RichText text={question.pregunta} /></legend><div className="answer-list">{question.opciones.map(option => <label key={option.id} className={`answer ${answers[question.id] === option.id ? 'selected' : ''} ${diagnosticSubmitted && option.correcta ? 'correct' : ''} ${diagnosticSubmitted && answers[question.id] === option.id && !option.correcta ? 'incorrect' : ''}`}><input type="radio" name={`question-${question.id}`} value={option.id} checked={answers[question.id] === option.id} onChange={() => setAnswers(previous => ({ ...previous, [question.id]: option.id }))} /><span className="answer-letter">{option.id.toUpperCase()}</span><span>{option.texto}</span>{diagnosticSubmitted && option.correcta && <Check size={16} />}</label>)}</div>{diagnosticSubmitted && <p className="question-explanation"><RichText text={question.explicacion} /></p>}</fieldset>)}</div><aside className="diagnostic-aside"><span className="eyebrow">A TU RITMO</span><h2>Una brújula,<br /><em>no una nota.</em></h2><p>Con al menos 4 aciertos puedes empezar por la Ruta 2. Las primeras lecciones seguirán ahí para repasarlas.</p><div className="question-progress"><strong>{Object.keys(answers).length}<span> / 5</span></strong><span>preguntas respondidas</span></div>{!diagnosticSubmitted ? <button className="button primary" disabled={Object.keys(answers).length !== DIAGNOSTICO_QUESTIONS.length} onClick={gradeDiagnostic}>Ver mi punto de partida<ArrowRight size={16} /></button> : <div className="diagnostic-result" role="status"><strong>{score} de 5 aciertos</strong><p>{score >= 4 ? 'Ya tienes una base. Puedes empezar a manipular archivos.' : 'La Ruta 1 te ayudará a construir una buena base.'}</p><button className="button primary" onClick={() => openActivity(score >= 4 ? '2.1' : '1.1')}>Empezar Ruta {score >= 4 ? '2' : '1'}<ArrowRight size={16} /></button><button className="text-button" onClick={startDiagnostic}>Responder de nuevo<RotateCcw size={13} /></button></div>}</aside></div>
        </>}

        {screen === 'summary' && (() => { const route = ROUTES.find(route => route.id === summaryRoute); return <section className={`summary-page ${route.color}`}><span className="eyebrow">RETO RESUELTO / RUTA {route.number}</span><div className="summary-stamp"><Check size={42} strokeWidth={1.2} /></div><h1 ref={pageHeading} tabIndex={-1}>Ya sabes un poco <em>más.</em></h1><p>Has completado el reto de {route.name.toLowerCase()}. Una nueva marca en tu cuaderno:</p><h2>{route.badge}</h2><div className="summary-note"><span>PARA LLEVAR CONTIGO</span><p>Guarda las notas de esta ruta. No hace falta recordar cada opción para saber encontrar la respuesta.</p><button className="text-button" onClick={() => downloadNotes(route.id)}>Descargar notas<Download size={15} /></button></div><div className="summary-actions"><button className="button primary" onClick={() => navigate('routes')}>{route.id === 'ruta3' ? 'Volver al mapa' : 'Continuar el recorrido'}<ArrowRight size={16} /></button><button className="text-button" onClick={() => navigate('progress')}>Ver mi progreso<TrendingUp size={15} /></button></div></section>; })()}
        <footer className="page-footer"><span>LINUXLAB <span className="footer-dot">/</span> APRENDER HACIENDO</span><span>Un comando puede ser un buen comienzo.</span></footer>
      </main>
    </div>
    {reset && <Modal title={reset === 'environment' ? '¿Volver al punto de partida?' : '¿Empezar un cuaderno nuevo?'} onClose={() => setReset(null)}><p>{reset === 'environment' ? 'Se reiniciarán los archivos y el historial de esta práctica. Tus actividades ya completadas se conservan.' : 'Se borrarán las prácticas, el diagnóstico y los comandos guardados en este cuaderno. Esta acción no se puede deshacer.'}</p><div className="modal-actions"><button className="button secondary" onClick={() => setReset(null)}>Seguir como estoy</button><button className="button primary" onClick={() => { if (reset === 'environment') setSession(newSession(activity)); else { setProgress({ ...EMPTY_PROGRESS }); setSession(newSession(CURRICULUM[0])); navigate('home'); } setReset(null); }}>{reset === 'environment' ? 'Reiniciar esta práctica' : 'Crear cuaderno nuevo'}<RotateCcw size={14} /></button></div></Modal>}
  </div>;
}
