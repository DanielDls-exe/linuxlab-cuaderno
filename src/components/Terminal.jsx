import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { COMMANDS, resolvePath, shortPath, tokenize } from '../lib/shell.js';

export default function Terminal({ session, onCommand, onReset, inserted, onInserted }) {
  const [input, setInput] = useState(''), [cursor, setCursor] = useState(-1), [draft, setDraft] = useState('');
  const [pagerPage, setPagerPage] = useState(0), [pagerDismissed, setPagerDismissed] = useState(null);
  const inputRef = useRef(null), outputRef = useRef(null);
  const pagerOpen = session.pager !== null && session.pager !== undefined && pagerDismissed !== session.pagerId;
  useEffect(() => { setInput(''); setCursor(-1); setPagerDismissed(null); setPagerPage(0); }, [session.id]);
  useEffect(() => { if (inserted) { setInput(inserted.text); inputRef.current?.focus(); onInserted(); } }, [inserted, onInserted]);
  useEffect(() => { if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight; }, [session.lines.length]);
  useEffect(() => { if (pagerOpen) { setPagerPage(0); inputRef.current?.focus(); } }, [session.pagerId]);
  const history = session.lines.filter(line => line.command !== undefined && line.command.trim()).map(line => line.command);
  function submit(event) { event.preventDefault(); if (pagerOpen) return; onCommand(input); setInput(''); setCursor(-1); setDraft(''); }
  function keyDown(event) {
    if (pagerOpen) {
      if (['q', 'Escape', ' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        if (event.key === 'q' || event.key === 'Escape') setPagerDismissed(session.pagerId);
        else setPagerPage(page => Math.min(Math.max(0, Math.ceil(session.pager.split('\n').length / 12) - 1), Math.max(0, page + (['PageUp', 'ArrowUp'].includes(event.key) ? -1 : 1))));
      }
      return;
    }
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault(); if (cursor === -1) setDraft(input);
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1); setCursor(next); setInput(history[next]);
    } else if (event.key === 'ArrowDown' && cursor !== -1) {
      event.preventDefault(); const next = cursor + 1; setCursor(next >= history.length ? -1 : next); setInput(next >= history.length ? draft : history[next]);
    } else if (event.key === 'Tab' && !event.shiftKey && input.trim() && !session.pendingAction) {
      // Empty prompt and Shift+Tab keep normal keyboard navigation available.
      let parts;
      try { parts = tokenize(input); } catch { return; }
      if (parts.some(part => part.type === 'operator')) return;
      const raw = input.split(' '), last = raw[raw.length - 1];
      let matches;
      if (raw.length === 1) matches = COMMANDS.filter(command => command.startsWith(last)).map(command => command + ' ');
      else {
        const slash = last.lastIndexOf('/'), prefix = last.slice(0, slash + 1), partial = last.slice(slash + 1);
        const path = resolvePath(session.cwd, prefix || '.');
        matches = (session.vfs[path]?.children || []).filter(name => name.startsWith(partial)).map(name => prefix + name + (session.vfs[`${path === '/' ? '' : path}/${name}`]?.type === 'dir' ? '/' : ''));
      }
      if (matches.length === 1) { event.preventDefault(); raw[raw.length - 1] = matches[0]; setInput(raw.join(' ')); }
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'l') { event.preventDefault(); onCommand('clear'); }
  }
  const pagerLines = pagerOpen ? session.pager.split('\n') : [];
  return <section className="terminal" aria-label="Terminal del laboratorio">
    <div className="terminal-toolbar"><div><span className="terminal-square">&gt;_</span><span>ana@linuxlab</span><span className="terminal-path">{shortPath(session.cwd)}</span></div><button onClick={onReset} title="Reiniciar únicamente esta práctica"><RotateCcw size={13} /><span>Reiniciar</span></button></div>
    <div className="terminal-output" ref={outputRef} role="log" aria-label="Historial de comandos" aria-live="polite" aria-relevant="additions text" tabIndex={0}>
      <div className="terminal-welcome"><span>LINUXLAB / ENTORNO VIRTUAL</span><p>Tu espacio para probar. Escribe <b>help</b> si necesitas orientarte.</p></div>
      {session.lines.map((line, index) => <div key={index} className={`terminal-entry ${line.status || ''}`}>
        {line.command !== undefined && <div className="terminal-command"><span>{shortPath(line.cwd)} <b>$</b></span><span>{line.command || ' '}</span></div>}
        {line.output && <pre>{line.output}</pre>}
      </div>)}
    </div>
    {pagerOpen && <div className="terminal-pager" role="region" aria-label="Visor de archivos less" tabIndex={0} onKeyDown={keyDown}>
      <div className="pager-title"><span>less · página {pagerPage + 1} / {Math.max(1, Math.ceil(pagerLines.length / 12))}</span><button onClick={() => { setPagerDismissed(session.pagerId); inputRef.current?.focus(); }} aria-label="Cerrar visor less"><X size={15} /></button></div>
      <pre>{pagerLines.slice(pagerPage * 12, (pagerPage + 1) * 12).join('\n')}</pre>
      <div className="pager-actions"><button disabled={pagerPage === 0} onClick={() => setPagerPage(page => page - 1)}>Anterior</button><span>Espacio: avanzar · q: salir</span><button disabled={(pagerPage + 1) * 12 >= pagerLines.length} onClick={() => setPagerPage(page => page + 1)}>Siguiente</button></div>
    </div>}
    <form className={`terminal-input ${session.pendingAction ? 'confirming' : ''}`} onSubmit={submit}>
      <label htmlFor="terminal-command" className="sr-only">{session.pendingAction ? 'Confirmar operación: s para aceptar, Enter para cancelar' : 'Escribe un comando Linux'}</label><span aria-hidden="true">{session.pendingAction ? 'confirmar [s/N]' : `${shortPath(session.cwd)} $`}</span>
      <input id="terminal-command" ref={inputRef} value={input} onChange={event => setInput(event.target.value)} onKeyDown={keyDown} placeholder={pagerOpen ? 'Pulsa q para salir del visor' : session.pendingAction ? 's / Enter' : 'Escribe aquí…'} autoComplete="off" autoCapitalize="off" spellCheck={false} />
      <button type="submit" aria-label="Ejecutar comando" disabled={pagerOpen}><ArrowUpRight size={19} /></button>
    </form>
    <div className="terminal-status"><span><ShieldCheck size={12} />{session.pendingAction ? 'Esperando tu confirmación' : 'Sistema virtual · modo seguro'}</span><span>↑↓ historial · Tab completar</span></div>
  </section>;
}
