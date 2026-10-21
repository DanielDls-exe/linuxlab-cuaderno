import { GLOSARIO_DATA } from '../data/curriculum.js';

export const COMMANDS = ['echo', 'pwd', 'cd', 'ls', 'cat', 'less', 'head', 'tail', 'mkdir', 'touch', 'cp', 'mv', 'rm', 'rmdir', 'find', 'grep', 'wc', 'sort', 'help', 'man', 'clear'];
const HOME = '/home/ana';
const copy = value => JSON.parse(JSON.stringify(value));
const join = (parent, name) => `${parent === '/' ? '' : parent}/${name}`;
const parentOf = path => path.slice(0, path.lastIndexOf('/')) || '/';
const nameOf = path => path.split('/').pop();
export const shortPath = path => path === HOME || path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path;

export function resolvePath(cwd, target = '~', previous = HOME) {
  if (target === '-') return previous;
  if (target === '~') return HOME;
  if (target.startsWith('~/')) target = HOME + target.slice(1);
  const parts = (target.startsWith('/') ? target : join(cwd, target)).split('/');
  const stack = [];
  for (const part of parts) {
    if (part === '..') stack.pop();
    else if (part && part !== '.') stack.push(part);
  }
  return '/' + stack.join('/');
}

// Keep quote information: a quoted '*' is a filename, not a glob.
export function tokenize(line) {
  const tokens = [];
  let value = '', started = false, quote = null, glob = false;
  const flush = () => {
    if (started) tokens.push({ value, glob, type: 'word' });
    value = ''; started = false; glob = false;
  };
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\' && quote !== "'") {
      if (i + 1 === line.length) throw new Error('La línea termina en una barra de escape. Completa el carácter siguiente.');
      if (quote === '"' && !['"', '\\', '$', '`', '\n'].includes(line[i + 1])) { value += ch; continue; }
      value += line[++i]; started = true; continue;
    }
    if (quote) {
      if (ch === quote) quote = null;
      else value += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; started = true; continue; }
    if (/\s/.test(ch)) { flush(); continue; }
    if (ch === '|' || ch === '>' || ch === '&') {
      flush();
      let op = ch;
      if (line[i + 1] === ch && (ch === '>' || ch === '&')) { op += ch; i++; }
      if (op === '&' || op === '|' && line[i + 1] === '|') throw new Error('En este laboratorio se admiten |, >, >> y &&.');
      tokens.push({ value: op, type: 'operator' });
      continue;
    }
    started = true; value += ch;
    if (ch === '*' || ch === '?') glob = true;
  }
  if (quote) throw new Error('Hay una comilla sin cerrar. Cierra el texto con la misma comilla con la que lo abriste.');
  flush();
  return tokens;
}

function parse(line) {
  const tokens = tokenize(line);
  if (!tokens.length) return [];
  const groups = [];
  let group = { stages: [], redirect: null }, words = [];
  const finishStage = () => {
    if (!words.length) throw new Error('Falta un comando junto al operador. Ejemplo: cat notas.txt | head -n 2');
    group.stages.push(words); words = [];
  };
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'word') { words.push(token); continue; }
    if (token.value === '>' || token.value === '>>') {
      if (group.redirect) throw new Error('Usa una sola redirección de salida por grupo de comandos.');
      const target = tokens[++i];
      if (!target || target.type !== 'word') throw new Error('Después de > o >> debes indicar el archivo de destino.');
      group.redirect = { target: target.value, append: token.value === '>>' };
    } else if (token.value === '|') finishStage();
    else { finishStage(); groups.push(group); group = { stages: [], redirect: null }; }
  }
  finishStage(); groups.push(group);
  return groups;
}

function globRegex(pattern) {
  return new RegExp('^' + [...pattern].map(ch => ch === '*' ? '.*' : ch === '?' ? '.' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$');
}

function expand(token, state) {
  if (!token.glob) return [token.value];
  const slash = token.value.lastIndexOf('/');
  const prefix = slash < 0 ? '' : token.value.slice(0, slash + 1);
  const pattern = token.value.slice(slash + 1);
  const directory = state.vfs[resolvePath(state.cwd, prefix || '.')];
  if (directory?.type !== 'dir') return [token.value];
  const names = directory.children.filter(name => (pattern.startsWith('.') || !name.startsWith('.')) && globRegex(pattern).test(name)).sort();
  return names.length ? names.map(name => prefix + name) : [token.value];
}

function requireNode(vfs, path, type) {
  const node = vfs[path];
  if (!node) throw new Error(`No existe «${path}». Usa ls para comprobar el nombre y la ruta.`);
  if (type && node.type !== type) throw new Error(type === 'dir' ? `«${path}» no es un directorio.` : `«${path}» es un directorio; indica un archivo.`);
  return node;
}

function put(vfs, path, node) {
  const parent = requireNode(vfs, parentOf(path), 'dir');
  vfs[path] = node;
  if (!parent.children.includes(nameOf(path))) parent.children.push(nameOf(path));
}

function remove(vfs, path) {
  const node = vfs[path];
  if (!node) return;
  if (node.type === 'dir') for (const name of [...node.children]) remove(vfs, join(path, name));
  const parent = vfs[parentOf(path)];
  if (parent?.children) parent.children = parent.children.filter(name => name !== nameOf(path));
  delete vfs[path];
}

function cloneNode(vfs, source, destination) {
  const node = requireNode(vfs, source);
  const existing = vfs[destination];
  if (existing && existing.type !== node.type) throw new Error('No puedes reemplazar un archivo por una carpeta ni una carpeta por un archivo.');
  if (node.type === 'file') put(vfs, destination, copy(node));
  else {
    if (!existing) put(vfs, destination, { type: 'dir', children: [] });
    for (const name of [...node.children]) cloneNode(vfs, join(source, name), join(destination, name));
  }
}

function options(args, allowed) {
  const flags = new Set(), positional = [];
  let end = false;
  for (const arg of args) {
    if (arg === '--' && !end) { end = true; continue; }
    if (!end && arg.startsWith('-') && arg !== '-') {
      for (const ch of arg.slice(1)) {
        if (!allowed.includes(ch)) throw new Error(`La opción «${arg}» no está disponible aquí. Consulta --help.`);
        flags.add(ch);
      }
    } else positional.push(arg);
  }
  return { flags, positional };
}

function manual(command) {
  const entry = GLOSARIO_DATA.find(item => item.cmd === command);
  if (entry) return `${entry.cmd} — ${entry.descripcion}\n\nUso: ${entry.sintaxis}\n${entry.opciones.join('\n')}\n\nEjemplo: ${entry.ejemplo}`;
  const extra = { wc: 'wc [-lwc] [archivo]\nCuenta líneas (-l), palabras (-w) o bytes (-c). También recibe texto por una tubería.', sort: 'sort [-ru] [archivo]\nOrdena líneas. -r invierte el orden y -u elimina duplicados.', help: 'Comandos del laboratorio:\n' + COMMANDS.join('  ') };
  if (extra[command]) return extra[command];
  throw new Error(`No hay una ficha para «${command}». Escribe help para consultar los comandos disponibles.`);
}

function execute(words, state, input = null, inputSources = []) {
  const command = words[0].value;
  const args = words.slice(1).flatMap(word => expand(word, state));
  const { vfs, cwd } = state;
  const path = value => resolvePath(cwd, value, state.prevCwd);
  const event = { command, args, globPatterns: words.slice(1).filter(word => word.glob).map(word => word.value), cwdBefore: cwd, cwdAfter: cwd, paths: [], sources: [...inputSources], output: '', status: 'ok' };
  const out = (output = '', extra = {}) => ({ state, event: { ...event, output }, output, ...extra });
  const targetPaths = values => values.map(value => path(value));
  if (!COMMANDS.includes(command)) throw new Error(`«${command}» no está disponible en este simulador. Escribe help para ver los comandos.`);
  if (args.includes('--help')) return out(manual(command));
  if (command === 'help') return out(manual('help'));
  if (command === 'man') { if (!args[0]) throw new Error('Indica el comando que quieres consultar. Ejemplo: man ls'); return out(manual(args[0])); }
  if (command === 'clear') return out('', { clearScreen: true });
  if (command === 'echo') return out((args[0] === '-n' ? args.slice(1) : args).join(' '));
  if (command === 'pwd') return out(cwd);
  if (command === 'cd') {
    if (args.length > 1) throw new Error('cd recibe una sola ruta. Usa comillas si contiene espacios.');
    const destination = path(args[0] || '~'); requireNode(vfs, destination, 'dir');
    state.prevCwd = cwd; state.cwd = destination; event.cwdAfter = destination; event.paths = [destination];
    return out(args[0] === '-' ? destination : '');
  }
  if (command === 'ls') {
    const { flags, positional } = options(args, 'al');
    event.paths = targetPaths(positional.length ? positional : ['.']);
    const sections = event.paths.map(target => {
      const node = requireNode(vfs, target);
      const names = node.type === 'file' ? [nameOf(target)] : [...(flags.has('a') ? ['.', '..'] : []), ...node.children.filter(name => flags.has('a') || !name.startsWith('.')).sort()];
      return names.map(name => {
        const child = node.type === 'file' ? node : name === '.' || name === '..' ? { type: 'dir' } : vfs[join(target, name)];
        const label = name + (child?.type === 'dir' && name !== '.' && name !== '..' ? '/' : '');
        return flags.has('l') ? `${child?.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'}  ana  ${String(child?.content?.length || 0).padStart(5)}  ${child?.date || '21 Oct 2026'}  ${label}` : label;
      }).join('\n');
    });
    return out(sections.join('\n'));
  }
  if (['cat', 'less', 'head', 'tail', 'wc', 'sort'].includes(command)) {
    let limit = 10, readArgs = [...args];
    if (command === 'head' || command === 'tail') {
      const n = readArgs.indexOf('-n');
      if (n >= 0) {
        if (!/^\d+$/.test(readArgs[n + 1] || '')) throw new Error('-n necesita un número de líneas igual o mayor que cero.');
        limit = Number(readArgs[n + 1]); readArgs.splice(n, 2);
      }
    }
    const { flags, positional } = options(readArgs, command === 'wc' ? 'lwc' : command === 'sort' ? 'ru' : command === 'cat' ? 'n' : '');
    if (!positional.length && input === null) throw new Error(`${command} necesita un archivo o texto recibido por una tubería.`);
    event.paths = targetPaths(positional); event.sources.push(...event.paths);
    const text = positional.length ? event.paths.map(p => requireNode(vfs, p, 'file').content || '').join('\n') : input;
    const lines = text === '' ? [] : text.replace(/\n$/, '').split('\n');
    if (command === 'head') return out(lines.slice(0, limit).join('\n'));
    if (command === 'tail') return out((limit ? lines.slice(-limit) : []).join('\n'));
    if (command === 'less') return out(text, { pager: text });
    if (command === 'cat' && flags.has('n')) return out(lines.map((line, index) => `${String(index + 1).padStart(6)}  ${line}`).join('\n'));
    if (command === 'sort') {
      let sorted = lines.sort();
      if (flags.has('u')) sorted = [...new Set(sorted)];
      if (flags.has('r')) sorted.reverse();
      return out(sorted.join('\n'));
    }
    if (command === 'wc') {
      const counts = { l: (text.match(/\n/g) || []).length, w: text.trim() ? text.trim().split(/\s+/).length : 0, c: new TextEncoder().encode(text).length };
      return out((flags.size ? ['l', 'w', 'c'].filter(flag => flags.has(flag)) : ['l', 'w', 'c']).map(flag => counts[flag]).join(' '));
    }
    return out(text);
  }
  if (command === 'find') {
    let root = '.', pattern = '*', type = null;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-name') { pattern = args[++i]; if (pattern === undefined) throw new Error('Después de -name indica un patrón, por ejemplo "*.txt".'); }
      else if (args[i] === '-type') { type = args[++i]; if (!['f', 'd'].includes(type)) throw new Error('Usa -type f para archivos o -type d para carpetas.'); }
      else if (args[i].startsWith('-')) throw new Error('find admite -name y -type en este laboratorio.');
      else root = args[i];
    }
    const rootPath = path(root); requireNode(vfs, rootPath); event.paths = [rootPath];
    const found = [];
    const walk = p => {
      const node = vfs[p];
      if ((!type || node.type === (type === 'f' ? 'file' : 'dir')) && globRegex(pattern).test(nameOf(p))) found.push(p);
      if (node.type === 'dir') for (const name of node.children) walk(join(p, name));
    };
    walk(rootPath);
    event.foundPaths = found;
    return out(found.map(p => root.startsWith('/') ? p : p === rootPath ? root : `${root.replace(/\/$/, '')}/${p.slice(rootPath.length + 1)}`).join('\n'));
  }
  if (command === 'grep') {
    const { flags, positional } = options(args, 'inr');
    const pattern = positional.shift();
    if (pattern === undefined) throw new Error('Indica el patrón de búsqueda. Ejemplo: grep "ERROR" servidor.log');
    let regex;
    try { regex = new RegExp(pattern, flags.has('i') ? 'i' : ''); } catch { throw new Error('La expresión de búsqueda no es válida. Revisa los corchetes y las barras.'); }
    const files = [];
    const collect = p => { const node = requireNode(vfs, p); if (node.type === 'dir') { if (!flags.has('r')) throw new Error('Para buscar dentro de una carpeta usa grep -r.'); node.children.forEach(name => collect(join(p, name))); } else files.push(p); };
    targetPaths(positional).forEach(collect); event.paths = files; event.sources.push(...files); event.pattern = pattern;
    if (!files.length && input === null) throw new Error('Indica un archivo o conecta una entrada mediante |.');
    const texts = files.length ? files.map(p => ({ text: vfs[p].content || '', path: p })) : [{ text: input }];
    const output = texts.flatMap(item => item.text.split('\n').flatMap((line, index) => regex.test(line) ? [`${files.length > 1 ? item.path + ':' : ''}${flags.has('n') ? index + 1 + ':' : ''}${line}`] : [])).join('\n');
    return out(output, { exitCode: output ? 0 : 1 });
  }
  if (command === 'mkdir' || command === 'touch') {
    const { flags, positional } = options(args, command === 'mkdir' ? 'p' : '');
    if (!positional.length) throw new Error(`${command} necesita el nombre del elemento que quieres crear.`);
    event.paths = targetPaths(positional);
    for (const target of event.paths) {
      if (command === 'touch') {
        if (!vfs[target]) put(vfs, target, { type: 'file', content: '', size: 0 });
        vfs[target].date = new Date().toLocaleDateString('es-VE');
        continue;
      }
      if (flags.has('p')) {
        let current = '';
        for (const part of target.split('/').filter(Boolean)) {
          current += '/' + part;
          if (vfs[current]) requireNode(vfs, current, 'dir');
          else put(vfs, current, { type: 'dir', children: [] });
        }
      } else {
        if (vfs[target]) throw new Error(`«${target}» ya existe. Usa otro nombre o mkdir -p si quieres conservar una carpeta existente.`);
        put(vfs, target, { type: 'dir', children: [] });
      }
    }
    return out();
  }
  if (command === 'cp' || command === 'mv') {
    const { flags, positional } = options(args, command === 'cp' ? 'rRi' : 'i');
    if (positional.length < 2) throw new Error(`${command} necesita origen y destino. Ejemplo: ${command} notas.txt docs/`);
    const destination = path(positional.pop()), sources = targetPaths(positional);
    if (sources.some((source, index) => sources.some((other, otherIndex) => index !== otherIndex && (source === other || source.startsWith(other + '/'))))) throw new Error('Los orígenes se repiten o están contenidos unos dentro de otros. Copia o mueve cada grupo por separado.');
    if (sources.length > 1) requireNode(vfs, destination, 'dir');
    event.paths = sources; event.destinations = [];
    const operations = [];
    for (const source of sources) {
      const node = requireNode(vfs, source);
      const target = vfs[destination]?.type === 'dir' ? join(destination, nameOf(source)) : destination;
      if (source === '/' || source === '/home' || source === HOME) throw new Error('Las carpetas base del laboratorio no se pueden mover ni copiar. Practica dentro de tu carpeta personal.');
      if (source === target || node.type === 'dir' && target.startsWith(source + '/')) throw new Error('El destino está dentro del origen o es el mismo elemento. Elige una carpeta diferente.');
      if (command === 'cp' && node.type === 'dir' && !flags.has('r') && !flags.has('R')) throw new Error('Para copiar una carpeta y su contenido agrega -r.');
      if (command === 'mv' && vfs[target]?.type === 'dir' && vfs[target].children.length) throw new Error('La carpeta de destino ya contiene archivos. Usa un nombre diferente.');
      requireNode(vfs, parentOf(target), 'dir');
      if (vfs[target] && vfs[target].type !== node.type) throw new Error('El origen y el destino deben ser del mismo tipo.');
      operations.push({ source, target });
      event.destinations.push(target);
    }
    if (flags.has('i') && operations.some(operation => vfs[operation.target])) {
      event.status = 'confirm';
      return out(`¿Reemplazar ${operations.filter(operation => vfs[operation.target]).map(operation => nameOf(operation.target)).join(', ')}? Escribe s para aceptar o pulsa Enter para cancelar.`, { pendingAction: { kind: 'overwrite', operations, event } });
    }
    for (const { source, target } of operations) {
      cloneNode(vfs, source, target);
      if (command === 'mv') {
        remove(vfs, source);
        if (state.cwd === source || state.cwd.startsWith(source + '/')) state.cwd = target + state.cwd.slice(source.length);
      }
    }
    event.cwdAfter = state.cwd;
    return out();
  }
  if (command === 'rm' || command === 'rmdir') {
    const { flags, positional } = options(args, command === 'rm' ? 'ifrR' : '');
    if (command === 'rm' && (flags.has('r') || flags.has('R') || flags.has('f')) && words.some(word => word.glob && ['*', '/*', '~/*'].includes(word.value))) throw new Error('Modo seguro: evita un borrado masivo con rm -rf y *. Revisa primero con ls y selecciona objetivos concretos.');
    if (!positional.length) throw new Error(`${command} necesita el nombre del elemento que quieres borrar.`);
    event.paths = targetPaths(positional);
    for (const target of event.paths) {
      const node = vfs[target];
      if (!node && command === 'rm' && flags.has('f')) continue;
      requireNode(vfs, target, command === 'rmdir' ? 'dir' : undefined);
      if (['/', '/home', HOME].includes(target) || state.cwd === target || state.cwd.startsWith(target + '/')) throw new Error('Este borrado incluye tu ubicación actual o una carpeta base. Cambia de ubicación y elige un objetivo más específico.');
      if (node.type === 'dir' && command === 'rmdir' && node.children.length) throw new Error('La carpeta contiene elementos. rmdir solo elimina carpetas vacías.');
      if (node.type === 'dir' && command === 'rm' && !flags.has('r') && !flags.has('R')) throw new Error('Es una carpeta. Usa rmdir si está vacía, o rm -r para un borrado recursivo.');
    }
    if (command === 'rmdir') { event.paths.forEach(p => remove(vfs, p)); return out(); }
    const targets = event.paths.filter(p => vfs[p]);
    if (!targets.length) return out();
    event.status = 'confirm';
    return out(`¿Borrar ${targets.map(nameOf).join(', ')}? Escribe s para confirmar o pulsa Enter para cancelar.`, { pendingAction: { kind: 'remove', targets, event } });
  }
}

function result(state, extra = {}) { return { ...state, output: '', events: [], status: 'ok', pendingAction: null, ...extra }; }

function executeGroups(groups, original) {
  let state = { vfs: copy(original.vfs), cwd: original.cwd, prevCwd: original.prevCwd };
  let events = [], outputs = [], pager = null, clearScreen = false, lastCode = 0;
  for (let index = 0; index < groups.length; index++) {
    const group = groups[index];
    // A paused destructive command must not leave a half-evaluated pipeline.
    if (group.stages.some(words => words[0].value === 'rm' || ['cp', 'mv'].includes(words[0].value) && words.some(word => /^-[^-]*i/.test(word.value))) && (group.stages.length > 1 || group.redirect)) return result(state, { events, status: 'error', output: 'Practica las operaciones con confirmación en una línea separada, sin tuberías ni redirección.' });
    const beforeGroup = copy(state);
    try {
      let redirectPath = null;
      if (group.redirect) {
        redirectPath = resolvePath(state.cwd, group.redirect.target);
        requireNode(state.vfs, parentOf(redirectPath), 'dir');
        if (state.vfs[redirectPath]?.type === 'dir') throw new Error('La redirección necesita un archivo de destino, no una carpeta.');
        if (!group.redirect.append || !state.vfs[redirectPath]) put(state.vfs, redirectPath, { type: 'file', content: '', size: 0 });
      }
      let input = null, sources = [], stageEvents = [], output = '';
      for (const [stageIndex, words] of group.stages.entries()) {
        const response = execute(words, state, input, sources);
        response.event.piped = stageIndex > 0;
        response.event.inputCommand = stageIndex > 0 ? group.stages[stageIndex - 1][0].value : null;
        output = response.output; state = response.state;
        stageEvents.push(response.event); sources = [...new Set(response.event.sources)];
        if (response.pendingAction) return result(state, { events: [...events, ...stageEvents], status: 'confirm', output: [...outputs, output].filter(Boolean).join('\n'), pendingAction: { ...response.pendingAction, remaining: groups.slice(index + 1) } });
        clearScreen ||= Boolean(response.clearScreen);
        pager = response.pager !== undefined && group.stages.length === 1 && !group.redirect ? response.pager : null;
        lastCode = response.exitCode || 0;
        // Stream-producing commands normally terminate their output with a newline.
        const noNewline = response.event.command === 'echo' && response.event.args[0] === '-n';
        input = output && !output.endsWith('\n') && !noNewline ? output + '\n' : output;
      }
      if (redirectPath) {
        const stream = input || '';
        const content = (group.redirect.append ? state.vfs[redirectPath].content : '') + stream;
        put(state.vfs, redirectPath, { type: 'file', content, size: content.length });
        stageEvents[stageEvents.length - 1].writtenPath = redirectPath;
        stageEvents[stageEvents.length - 1].redirect = group.redirect.append ? '>>' : '>';
      } else if (output) outputs.push(output);
      events.push(...stageEvents);
      if (lastCode) break;
    } catch (error) {
      // Reject an invalid group atomically: no orphaned VFS nodes or partial moves.
      state = beforeGroup;
      return result(state, { status: 'error', events, output: [...outputs, error.message].join('\n') });
    }
  }
  return result(state, { events, output: outputs.join('\n'), pager, clearScreen, exitCode: lastCode });
}

export function executeBashLine(line, state) {
  try { return executeGroups(parse(line), state); }
  catch (error) { return result({ vfs: copy(state.vfs), cwd: state.cwd, prevCwd: state.prevCwd }, { status: 'error', output: error.message }); }
}

export function confirmAction(state, pending, approved) {
  if (!approved) return result(state, { output: 'Operación cancelada. Los archivos siguen en su lugar.' });
  const next = { vfs: copy(state.vfs), cwd: state.cwd, prevCwd: state.prevCwd };
  if (pending.kind === 'overwrite') {
    for (const { source, target } of pending.operations) {
      cloneNode(next.vfs, source, target);
      if (pending.event.command === 'mv') {
        remove(next.vfs, source);
        if (next.cwd === source || next.cwd.startsWith(source + '/')) next.cwd = target + next.cwd.slice(source.length);
      }
    }
  } else pending.targets.forEach(path => remove(next.vfs, path));
  const event = { ...pending.event, status: 'ok', confirmed: true, cwdAfter: next.cwd };
  const continuation = executeGroups(pending.remaining || [], next);
  return { ...continuation, events: [event, ...continuation.events], output: ['Operación confirmada.', continuation.output].filter(Boolean).join('\n') };
}
