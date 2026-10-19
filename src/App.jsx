import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Terminal,
  Folder,
  FolderOpen,
  FileText,
  Lock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  HelpCircle,
  Eye,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  BarChart3,
  Map,
  Play,
  Download,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Info,
  X,
  Compass,
  Layers,
  Unlock,
  Trash2,
  ArrowRight,
  Printer,
  Code2,
  Lightbulb,
  Bot,
  Send,
  Loader2,
  Wand2,
  MessageSquare
} from 'lucide-react';

const GEMINI_MODEL = 'gemini-3-flash-preview';
const apiKey = "";

async function callGeminiAPI(payload) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (attempt < delays.length && (response.status === 429 || response.status >= 500)) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Respuesta vacía del modelo');
      }
      return text;
    } catch (err) {
      if (attempt < delays.length) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
      } else {
        throw err;
      }
    }
  }
}

async function askContextualLinuxTutor({ userQuestion, activity, cwd, vfs, cmdHistory }) {
  const dirChildren = vfs[cwd]?.children || [];
  const recentCmds = cmdHistory.slice(-5).map((h) => `$ ${h.cmd} -> ${h.output || '(sin salida)'}`).join('\n');

  const systemPrompt = [
    'Eres el Tutor IA Socrático de "LinuxLab", una plataforma educativa interactiva para aprender comandos Linux sin miedo.',
    'Tu objetivo es ayudar al estudiante (usuario "ana") de forma empática, clara, breve (máximo 3 párrafos cortos) y pedagógica.',
    'Usa analogías con la interfaz gráfica cuando sea útil y destaca siempre los hábitos de seguridad (como Modo Seguro o vista previa con ls).',
    'No des simplemente la respuesta final sin explicar el porqué; guía al estudiante según el estado actual de su terminal.'
  ].join(' ');

  const userPrompt = [
    `Contexto actual del laboratorio virtual:`,
    `- Actividad actual: ${activity ? `${activity.codigo} - ${activity.titulo}` : 'Exploración libre'}`,
    `- Objetivo de la actividad: ${activity?.objetivoTexto || activity?.escenario || 'Practicar comandos Linux'}`,
    `- Directorio actual (pwd): ${cwd}`,
    `- Archivos/carpetas en el directorio actual: ${dirChildren.join(', ') || '(vacío)'}`,
    `- Últimos comandos ejecutados por el estudiante:\n${recentCmds || '(ninguno todavía)'}`,
    ``,
    `Consulta del estudiante: "${userQuestion}"`
  ].join('\n');

  return await callGeminiAPI({
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  });
}

async function analyzeOrTranslateCommandAI(query) {
  const systemPrompt =
    'Eres un experto docente en Linux. El usuario puede escribir una intención en español (ej. "borrar archivos temporales con confirmación") o un comando de Linux (ej. "ls -la /home/ana"). Devuelve un objeto JSON estructurado que traduzca o desglose el comando pieza por pieza para un principiante.';

  const payload = {
    contents: [{ parts: [{ text: `Analiza o traduce a comando Bash de Linux: "${query}"` }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          comandoSugerido: { type: 'STRING' },
          proposito: { type: 'STRING' },
          nivelRiesgo: { type: 'STRING' },
          analogiaGrafica: { type: 'STRING' },
          consejoSeguridad: { type: 'STRING' },
          anatomia: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                fragmento: { type: 'STRING' },
                tipo: { type: 'STRING' },
                explicacion: { type: 'STRING' }
              },
              propertyOrdering: ['fragmento', 'tipo', 'explicacion']
            }
          }
        },
        propertyOrdering: [
          'comandoSugerido',
          'proposito',
          'nivelRiesgo',
          'analogiaGrafica',
          'consejoSeguridad',
          'anatomia'
        ]
      }
    }
  };

  const jsonStr = await callGeminiAPI(payload);
  return JSON.parse(jsonStr);
}

async function generateBonusDiagnosticQuestionAI(existingCount) {
  const systemPrompt =
    'Genera una pregunta de opción múltiple inédita, práctica y formativa sobre comandos básicos de Linux (pwd, cd, ls -la, cat, head, tail, mkdir -p, touch, cp -r, mv, rm -i, rmdir, comodines *, find, grep, tuberías | o redirección >). Asegúrate de que solo 1 de las 4 opciones tenga correcta: true.';

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Genera la pregunta de diagnóstico número ${existingCount + 1} con un caso cotidiano de terminal Linux.`
          }
        ]
      }
    ],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          pregunta: { type: 'STRING' },
          explicacion: { type: 'STRING' },
          opciones: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                texto: { type: 'STRING' },
                correcta: { type: 'BOOLEAN' }
              },
              propertyOrdering: ['id', 'texto', 'correcta']
            }
          }
        },
        propertyOrdering: ['pregunta', 'opciones', 'explicacion']
      }
    }
  };

  const jsonStr = await callGeminiAPI(payload);
  return JSON.parse(jsonStr);
}

async function generatePersonalizedProgressReportAI({ progress, totalPercent, ruta1Percent, ruta2Percent, ruta3Percent }) {
  const systemPrompt =
    'Eres un mentor pedagógico de LinuxLab. Analiza el progreso actual del estudiante y redacta una retroalimentación motivadora, breve y accionable en 3 secciones claras: 1) Fortalezas demostradas, 2) Próximo paso recomendado, y 3) Un mini-reto práctico personalizado que puede probar ahora mismo en la terminal de LinuxLab.';

  const userPrompt = [
    `Datos del estudiante en LinuxLab:`,
    `- Avance global: ${totalPercent}% (Ruta 1: ${ruta1Percent}%, Ruta 2: ${ruta2Percent}%, Ruta 3: ${ruta3Percent || 0}%)`,
    `- Lecciones completadas: ${progress.completedIds.join(', ') || 'Ninguna aún'}`,
    `- Comandos dominados: ${progress.learnedCommands.join(', ') || 'Ninguno aún'}`,
    `- Insignias obtenidas: ${progress.badges.join(', ') || 'Ninguna aún'}`,
    `- Puntaje en diagnóstico inicial: ${progress.diagnosticoCompletado ? `${progress.diagnosticoPuntaje}/5` : 'No realizado'}`
  ].join('\n');

  return await callGeminiAPI({
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] }
  });
}

const GLOSARIO_DATA = [
  {
    cmd: 'echo',
    categoria: 'Intro / Salida',
    sintaxis: 'echo [texto]',
    opciones: ['-n (no añade salto de línea final)'],
    riesgo: 'Seguro',
    descripcion: 'Imprime un mensaje de texto o el valor de una variable directamente en la pantalla de la terminal.',
    analogia: 'Como escribir una nota adhesiva y mostrarla en el monitor.',
    ejemplo: 'echo Hola Linux'
  },
  {
    cmd: 'pwd',
    categoria: 'Ruta 1 · Supervivencia',
    sintaxis: 'pwd',
    opciones: ['Sin opciones habituales'],
    riesgo: 'Seguro',
    descripcion: 'Muestra la ruta absoluta del directorio de trabajo actual (Print Working Directory).',
    analogia: 'Como mirar el pin de "Usted está aquí" en el mapa de un centro comercial o la barra de direcciones del explorador.',
    ejemplo: 'pwd'
  },
  {
    cmd: 'cd',
    categoria: 'Ruta 1 · Supervivencia',
    sintaxis: 'cd [ruta]',
    opciones: [
      'cd .. (sube un nivel a la carpeta padre)',
      'cd ~ (va al directorio personal /home/ana)',
      'cd - (regresa al directorio anterior)'
    ],
    riesgo: 'Seguro',
    descripcion: 'Cambia el directorio actual para desplazarte por las carpetas del sistema.',
    analogia: 'Hacer doble clic sobre una carpeta en el explorador de archivos para entrar en ella.',
    ejemplo: 'cd /home/ana/docs'
  },
  {
    cmd: 'ls',
    categoria: 'Ruta 1 · Supervivencia',
    sintaxis: 'ls [opciones] [ruta]',
    opciones: [
      '-a (muestra archivos y carpetas ocultos que empiezan con punto .)',
      '-l (formato largo con permisos, propietario, tamaño y fecha)',
      '-la (combina formato largo e incluye ocultos)'
    ],
    riesgo: 'Seguro',
    descripcion: 'Lista los archivos y subdirectorios contenidos dentro de una carpeta.',
    analogia: 'Abrir una ventana de carpeta y ver los íconos o la lista de detalles de sus archivos.',
    ejemplo: 'ls -la /home/ana'
  },
  {
    cmd: 'cat',
    categoria: 'Ruta 1 · Supervivencia',
    sintaxis: 'cat [archivo]',
    opciones: ['-n (enumera todas las líneas de salida)'],
    riesgo: 'Seguro',
    descripcion: 'Muestra de golpe todo el contenido de un archivo de texto directamente en la terminal.',
    analogia: 'Abrir un documento de bloc de notas rápido en modo solo lectura.',
    ejemplo: 'cat pista.txt'
  },
  {
    cmd: 'less',
    categoria: 'Ruta 1 · Supervivencia',
    sintaxis: 'less [archivo]',
    opciones: ['Espacio (avanzar página)', 'q (salir del visor)'],
    riesgo: 'Seguro',
    descripcion: 'Permite leer archivos de texto extensos de forma paginada sin saturar la pantalla.',
    analogia: 'Leer un documento PDF desplazándote página por página con la rueda del ratón.',
    ejemplo: 'less manual.txt'
  },
  {
    cmd: 'head',
    categoria: 'Ruta 1 · Supervivencia',
    sintaxis: 'head [opciones] [archivo]',
    opciones: ['-n X (muestra las primeras X líneas, por defecto 10)'],
    riesgo: 'Seguro',
    descripcion: 'Imprime únicamente las primeras líneas de un archivo de texto.',
    analogia: 'Leer solo el título y el primer párrafo de un informe para saber de qué trata.',
    ejemplo: 'head -n 5 bitacora.txt'
  },
  {
    cmd: 'tail',
    categoria: 'Ruta 1 · Supervivencia',
    sintaxis: 'tail [opciones] [archivo]',
    opciones: ['-n X (muestra las últimas X líneas, por defecto 10)'],
    riesgo: 'Seguro',
    descripcion: 'Imprime las últimas líneas de un archivo, ideal para revisar registros recientes.',
    analogia: 'Ir directamente al final de un libro o leer los últimos mensajes de un chat.',
    ejemplo: 'tail notas.txt'
  },
  {
    cmd: 'mkdir',
    categoria: 'Ruta 2 · Manipulación',
    sintaxis: 'mkdir [opciones] [directorio]',
    opciones: ['-p (crea toda la jerarquía de carpetas padres e hijas si no existen)'],
    riesgo: 'Bajo',
    descripcion: 'Crea uno o más directorios nuevos (Make Directory).',
    analogia: 'Clic derecho en el escritorio › Nuevo › Carpeta.',
    ejemplo: 'mkdir -p web/assets/css'
  },
  {
    cmd: 'touch',
    categoria: 'Ruta 2 · Manipulación',
    sintaxis: 'touch [archivo]',
    opciones: ['Sin opciones habituales en nivel básico'],
    riesgo: 'Bajo',
    descripcion: 'Crea un archivo vacío nuevo si no existe, o actualiza su fecha de modificación si ya existe.',
    analogia: 'Clic derecho › Nuevo › Documento de texto vacío.',
    ejemplo: 'touch web/index.html'
  },
  {
    cmd: 'cp',
    categoria: 'Ruta 2 · Manipulación',
    sintaxis: 'cp [opciones] [origen] [destino]',
    opciones: [
      '-r (copia recursiva, obligatoria para copiar carpetas completas)',
      '-i (pregunta antes de sobrescribir un archivo existente)'
    ],
    riesgo: 'Precaución',
    descripcion: 'Copia archivos o directorios desde una ruta de origen hacia un destino, conservando el original.',
    analogia: 'Seleccionar un archivo, presionar Ctrl+C y luego Ctrl+V en otra carpeta.',
    ejemplo: 'cp notas.txt docs/'
  },
  {
    cmd: 'mv',
    categoria: 'Ruta 2 · Manipulación',
    sintaxis: 'mv [origen] [destino]',
    opciones: ['-i (pregunta antes de sobrescribir un destino existente)'],
    riesgo: 'Precaución',
    descripcion: 'Mueve archivos/carpetas de lugar o les cambia el nombre si el destino está en la misma carpeta.',
    analogia: 'Cortar y pegar (Ctrl+X / Ctrl+V) para mover, o presionar F2 para cambiar el nombre.',
    ejemplo: 'mv *.jpg fotos/'
  },
  {
    cmd: 'rm',
    categoria: 'Ruta 2 · Manipulación',
    sintaxis: 'rm [opciones] [archivo]',
    opciones: [
      '-i (modo interactivo: pide confirmación antes de cada borrado)',
      '-r (borra directorios y todo su contenido recursivamente)',
      '-rf (forzado recursivo: ¡extremadamente peligroso!)'
    ],
    riesgo: 'Alto (Irreversible)',
    descripcion: 'Elimina archivos o directorios de forma permanente sin pasar por la Papelera de reciclaje.',
    analogia: 'Presionar Shift+Supr en la interfaz gráfica (borrado definitivo instantáneo).',
    ejemplo: 'rm -i basura.tmp'
  },
  {
    cmd: 'rmdir',
    categoria: 'Ruta 2 · Manipulación',
    sintaxis: 'rmdir [directorio]',
    opciones: ['Solo funciona si el directorio está completamente vacío'],
    riesgo: 'Bajo',
    descripcion: 'Elimina un directorio únicamente si no contiene ningún archivo ni subcarpeta oculta.',
    analogia: 'Tirar una caja de cartón después de verificar que no quedó nada adentro.',
    ejemplo: 'rmdir carpeta_vacia'
  },
  {
    cmd: 'find',
    categoria: 'Ruta 3 · Búsqueda y flujo',
    sintaxis: 'find [ruta] -name "[patrón]"',
    opciones: ['-name (busca por nombre)', '-type f (solo archivos)', '-type d (solo carpetas)'],
    riesgo: 'Seguro',
    descripcion: 'Busca archivos y carpetas en una jerarquía de directorios según criterios como nombre o tipo.',
    analogia: 'Usar la lupa de búsqueda avanzada del explorador de archivos en toda una carpeta.',
    ejemplo: 'find /home/ana -name "*.txt"'
  },
  {
    cmd: 'grep',
    categoria: 'Ruta 3 · Búsqueda y flujo',
    sintaxis: 'grep [opciones] "[texto]" [archivo]',
    opciones: ['-i (ignora mayúsculas/minúsculas)', '-n (muestra el número de línea)'],
    riesgo: 'Seguro',
    descripcion: 'Filtra y busca líneas que contengan una palabra o patrón específico dentro de un archivo.',
    analogia: 'Presionar Ctrl+F dentro de un documento para resaltar todas las veces que aparece una palabra.',
    ejemplo: 'grep -i "clave" bitacora.txt'
  },
  {
    cmd: '|',
    categoria: 'Ruta 3 · Búsqueda y flujo',
    sintaxis: 'comando1 | comando2',
    opciones: ['Operador de tubería (Pipe)'],
    riesgo: 'Seguro',
    descripcion: 'Conecta la salida del primer comando directamente como entrada del segundo comando.',
    analogia: 'Una cadena de montaje donde el resultado de una estación pasa directo a la siguiente.',
    ejemplo: 'ls -la | grep ".txt"'
  },
  {
    cmd: '>',
    categoria: 'Ruta 3 · Búsqueda y flujo',
    sintaxis: 'comando > [archivo]',
    opciones: ['> (sobrescribe el archivo)', '>> (añade al final sin borrar lo anterior)'],
    riesgo: 'Precaución',
    descripcion: 'Redirige el texto que saldría en pantalla y lo guarda dentro de un archivo.',
    analogia: 'En lugar de mostrar un reporte en el monitor, enviarlo directamente a "Guardar como archivo".',
    ejemplo: 'echo "Tarea terminada" > estado.txt'
  }
];

const DIAGNOSTICO_QUESTIONS = [
  {
    id: 1,
    pregunta: 'Acabas de abrir la terminal y no sabes en qué carpeta del sistema te encuentras. ¿Qué comando te dice tu ubicación exacta?',
    opciones: [
      { id: 'a', texto: 'whereis' },
      { id: 'b', texto: 'pwd', correcta: true },
      { id: 'c', texto: 'cd' },
      { id: 'd', texto: 'locate' }
    ],
    explicacion: '`pwd` significa "Print Working Directory" e imprime la ruta absoluta actual (por ejemplo, /home/ana).'
  },
  {
    id: 2,
    pregunta: 'Si estás dentro de `/home/ana/proyectos/web` y quieres subir un nivel hacia `/home/ana/proyectos`, ¿qué debes ejecutar?',
    opciones: [
      { id: 'a', texto: 'cd /' },
      { id: 'b', texto: 'cd ~' },
      { id: 'c', texto: 'cd ..', correcta: true },
      { id: 'd', texto: 'cd .' }
    ],
    explicacion: 'En Linux, `..` representa siempre el directorio padre (un nivel arriba), mientras que `.` es el directorio actual.'
  },
  {
    id: 3,
    pregunta: 'En Linux, los archivos de configuración suelen estar ocultos y su nombre empieza con un punto (ej. `.bashrc`). ¿Cómo los haces visibles al listar?',
    opciones: [
      { id: 'a', texto: 'ls -l' },
      { id: 'b', texto: 'ls -a', correcta: true },
      { id: 'c', texto: 'ls -h' },
      { id: 'd', texto: 'cat .*' }
    ],
    explicacion: 'La opción `-a` (all) de `ls` muestra todos los elementos, incluyendo los ocultos que inician con punto (`.`).'
  },
  {
    id: 4,
    pregunta: 'Necesitas crear una carpeta nueva llamada `respaldo` en tu ubicación actual. ¿Cuál es el comando apropiado?',
    opciones: [
      { id: 'a', texto: 'touch respaldo' },
      { id: 'b', texto: 'newdir respaldo' },
      { id: 'c', texto: 'mkdir respaldo', correcta: true },
      { id: 'd', texto: 'cp respaldo' }
    ],
    explicacion: '`mkdir` (Make Directory) crea carpetas nuevas, mientras que `touch` crea archivos vacíos.'
  },
  {
    id: 5,
    pregunta: '¿Por qué el comando `rm -rf *` o `rm -rf /` es considerado uno de los más peligrosos en la consola Linux?',
    opciones: [
      { id: 'a', texto: 'Porque reinicia el computador sin guardar los cambios.' },
      { id: 'b', texto: 'Porque borra archivos y carpetas recursivamente al instante, sin confirmación y sin pasar por la Papelera.', correcta: true },
      { id: 'c', texto: 'Porque bloquea la contraseña del usuario actual.' },
      { id: 'd', texto: 'Porque mueve todos los archivos a una carpeta oculta.' }
    ],
    explicacion: '`rm` no usa papelera de reciclaje; con `-r` (recursivo) y `-f` (forzado sin preguntar), destruye carpetas enteras de forma irreversible.'
  }
];

function createBaseVFS(type = 'ruta1') {
  const base = {
    '/': { type: 'dir', children: ['home'] },
    '/home': { type: 'dir', children: ['ana'] },
    '/home/ana': {
      type: 'dir',
      children: ['docs', 'proyectos', 'notas.txt', '.config_secreta']
    },
    '/home/ana/docs': {
      type: 'dir',
      children: ['pista.txt']
    },
    '/home/ana/proyectos': {
      type: 'dir',
      children: ['README.md']
    },
    '/home/ana/notas.txt': {
      type: 'file',
      size: 148,
      date: '18 Oct 10:15',
      content: 'Apuntes de Ana:\n1. Practicar comandos básicos en LinuxLab.\n2. Revisar la carpeta docs para leer pista.txt.\n3. Nunca usar rm -rf sin pensar.'
    },
    '/home/ana/.config_secreta': {
      type: 'file',
      size: 95,
      date: '18 Oct 09:00',
      content: '# Configuración oculta de Ana\nTEMA_TERMINAL="oscuro"\nMODO_SEGURO=activo\nCLAVE_INICIAL="explorador_curioso"'
    },
    '/home/ana/docs/pista.txt': {
      type: 'file',
      size: 182,
      date: '18 Oct 11:20',
      content: '¡Excelente trabajo leyendo este archivo!\nPista de supervivencia: Los archivos que comienzan con un punto (.) son ocultos.\nEn el Reto 1 buscarás un tesoro oculto dentro de proyectos.'
    },
    '/home/ana/proyectos/README.md': {
      type: 'file',
      size: 112,
      date: '18 Oct 08:45',
      content: '# Proyectos de Laboratorio\nAquí guardamos prácticas de desarrollo web y scripts de automatización.'
    }
  };

  if (type === 'reto1') {
    base['/home/ana/proyectos'].children = ['README.md', '.tesoro'];
    base['/home/ana/proyectos/.tesoro'] = {
      type: 'dir',
      children: ['clave.txt']
    };
    base['/home/ana/proyectos/.tesoro/clave.txt'] = {
      type: 'file',
      size: 164,
      date: '18 Oct 12:00',
      content: '========================================\n¡FELICIDADES EXPLORADOR/A!\nCódigo Secreto del Tesoro: LINUX-MASTER-2026\nHas dominado la navegación y lectura.\n========================================'
    };
  }

  if (type === 'ruta2_21') {
    // Lección 2.1: Crear carpeta web y archivo index.html
    base['/home/ana'].children = ['docs', 'proyectos', 'notas.txt'];
  }

  if (type === 'ruta2_22') {
    // Lección 2.2: Copiar notas.txt a docs/ o renombrar borrador.txt a final.txt
    base['/home/ana'].children = ['docs', 'proyectos', 'notas.txt', 'borrador.txt'];
    base['/home/ana/borrador.txt'] = {
      type: 'file',
      size: 88,
      date: '18 Oct 13:10',
      content: 'Versión preliminar del documento de arquitectura de software.'
    };
  }

  if (type === 'ruta2_23') {
    // Lección 2.3: Borrar basura.tmp con cuidado dejando intactos los demás
    base['/home/ana'].children = ['docs', 'notas.txt', 'importante.txt', 'basura.tmp'];
    base['/home/ana/importante.txt'] = {
      type: 'file',
      size: 120,
      date: '18 Oct 14:00',
      content: '¡NO BORRAR! Este archivo contiene las credenciales del servidor de producción.'
    };
    base['/home/ana/basura.tmp'] = {
      type: 'file',
      size: 42,
      date: '18 Oct 14:05',
      content: 'Archivo temporal corrupto de caché 0x004F.'
    };
  }

  if (type === 'ruta2_24') {
    // Lección 2.4: Comodines: mover foto1.jpg y foto2.jpg a imagenes/
    base['/home/ana'].children = ['docs', 'imagenes', 'notas.txt', 'foto1.jpg', 'foto2.jpg', 'reporte.pdf'];
    base['/home/ana/imagenes'] = {
      type: 'dir',
      children: []
    };
    base['/home/ana/foto1.jpg'] = {
      type: 'file',
      size: 2048,
      date: '18 Oct 15:00',
      content: '[Datos binarios simulados JPEG: Atardecer en la montaña]'
    };
    base['/home/ana/foto2.jpg'] = {
      type: 'file',
      size: 1850,
      date: '18 Oct 15:02',
      content: '[Datos binarios simulados JPEG: Equipo de desarrollo]'
    };
    base['/home/ana/reporte.pdf'] = {
      type: 'file',
      size: 4096,
      date: '18 Oct 15:05',
      content: '[Documento PDF: Métricas trimestrales]'
    };
  }

  if (type === 'reto2') {
    // Reto 2: Ordena la carpeta descargas
    base['/home/ana'].children = ['docs', 'descargas', 'notas.txt'];
    base['/home/ana/descargas'] = {
      type: 'dir',
      children: ['vacaciones.jpg', 'perfil.jpg', 'informe.pdf', 'temp.txt']
    };
    base['/home/ana/descargas/vacaciones.jpg'] = {
      type: 'file',
      size: 3120,
      date: '18 Oct 16:10',
      content: '[Imagen JPEG: Playa del Caribe]'
    };
    base['/home/ana/descargas/perfil.jpg'] = {
      type: 'file',
      size: 1420,
      date: '18 Oct 16:12',
      content: '[Imagen JPEG: Avatar profesional de Ana]'
    };
    base['/home/ana/descargas/informe.pdf'] = {
      type: 'file',
      size: 5400,
      date: '18 Oct 16:15',
      content: '[PDF importante: Presupuesto anual - Conservar en descargas]'
    };
    base['/home/ana/descargas/temp.txt'] = {
      type: 'file',
      size: 64,
      date: '18 Oct 16:18',
      content: 'Archivo residual de descarga incompleta. Eliminar.'
    };
  }

  if (type === 'ruta3_31') {
    // Lección 3.1: Buscar archivos con find
    base['/home/ana'].children = ['docs', 'proyectos', 'sistema', 'notas.txt'];
    base['/home/ana/docs'].children = ['pista.txt', 'manual.pdf'];
    base['/home/ana/docs/manual.pdf'] = {
      type: 'file',
      size: 3200,
      date: '18 Oct 17:00',
      content: '[Manual PDF de administración de sistemas]'
    };
    base['/home/ana/proyectos'].children = ['README.md', 'backend'];
    base['/home/ana/proyectos/backend'] = {
      type: 'dir',
      children: ['servidor.conf', 'claves_backup.txt']
    };
    base['/home/ana/proyectos/backend/servidor.conf'] = {
      type: 'file',
      size: 210,
      date: '18 Oct 17:05',
      content: 'PORT=8080\nENV=production\nDEBUG=false'
    };
    base['/home/ana/proyectos/backend/claves_backup.txt'] = {
      type: 'file',
      size: 140,
      date: '18 Oct 17:10',
      content: 'Archivo encontrado en subcarpeta profunda: TOKEN_BACKUP=99481-LINUX'
    };
    base['/home/ana/sistema'] = {
      type: 'dir',
      children: ['eventos.log']
    };
    base['/home/ana/sistema/eventos.log'] = {
      type: 'file',
      size: 512,
      date: '18 Oct 17:12',
      content: 'INFO: Arranque completo del servicio.'
    };
  }

  if (type === 'ruta3_32') {
    // Lección 3.2: Filtrar texto con grep
    base['/home/ana'].children = ['docs', 'servidor.log', 'notas.txt'];
    base['/home/ana/servidor.log'] = {
      type: 'file',
      size: 680,
      date: '18 Oct 17:30',
      content: [
        '2026-10-18 08:00:01 [INFO] Servicio web iniciado en el puerto 8080',
        '2026-10-18 08:04:12 [INFO] Conexión establecida desde 192.168.1.15',
        '2026-10-18 08:15:44 [ERROR] Fallo de conexión con la base de datos primaria',
        '2026-10-18 08:16:02 [WARN] Reintentando conexión en modo seguro',
        '2026-10-18 08:19:50 [INFO] Usuario ana inició sesión correctamente',
        '2026-10-18 08:22:10 [ERROR] Tiempo de espera agotado en el módulo de pagos',
        '2026-10-18 08:30:00 [INFO] Respaldo automático completado'
      ].join('\n')
    };
  }

  if (type === 'ruta3_33') {
    // Lección 3.3: Conectar comandos con tuberías (|)
    base['/home/ana'].children = ['docs', 'proyectos', 'notas.txt', 'agenda.txt', 'tareas.txt', 'foto.jpg', 'servidor.log'];
    base['/home/ana/agenda.txt'] = {
      type: 'file',
      size: 95,
      date: '18 Oct 18:00',
      content: 'Reunión con el equipo de infraestructura a las 10:00 AM.'
    };
    base['/home/ana/tareas.txt'] = {
      type: 'file',
      size: 110,
      date: '18 Oct 18:05',
      content: '1. Revisar logs\n2. Automatizar tuberías en Bash'
    };
    base['/home/ana/foto.jpg'] = {
      type: 'file',
      size: 2048,
      date: '18 Oct 18:08',
      content: '[Imagen JPEG]'
    };
    base['/home/ana/servidor.log'] = {
      type: 'file',
      size: 540,
      date: '18 Oct 18:10',
      content: [
        '2026-10-18 09:00 [INFO] Nodo 1 activo',
        '2026-10-18 09:05 [ERROR] Disco al 95% de capacidad',
        '2026-10-18 09:10 [INFO] Limpieza programada',
        '2026-10-18 09:15 [ERROR] Puerto 443 bloqueado temporalmente'
      ].join('\n')
    };
  }

  if (type === 'ruta3_34') {
    // Lección 3.4: Redirección de salida (> y >>)
    base['/home/ana'].children = ['docs', 'servidor.log', 'notas.txt'];
    base['/home/ana/servidor.log'] = {
      type: 'file',
      size: 480,
      date: '18 Oct 18:30',
      content: [
        '2026-10-18 10:01 [INFO] Sistema operativo actualizado',
        '2026-10-18 10:04 [ERROR] Certificado SSL próximo a vencer',
        '2026-10-18 10:09 [ERROR] Intento de acceso no autorizado bloqueado'
      ].join('\n')
    };
  }

  if (type === 'reto3') {
    // Reto 3: Auditoría de registros del servidor
    base['/home/ana'].children = ['docs', 'auditoria', 'notas.txt'];
    base['/home/ana/auditoria'] = {
      type: 'dir',
      children: ['README.txt', 'web', 'seguridad']
    };
    base['/home/ana/auditoria/README.txt'] = {
      type: 'file',
      size: 210,
      date: '18 Oct 19:00',
      content: 'Misión de Auditoría:\n1. Encuentra los archivos .log dentro de /home/ana/auditoria.\n2. Filtra las líneas que contengan la palabra INTRUSO.\n3. Guarda esas líneas en /home/ana/auditoria/evidencia.txt usando >.'
    };
    base['/home/ana/auditoria/web'] = {
      type: 'dir',
      children: ['acceso.log', 'index.html']
    };
    base['/home/ana/auditoria/web/index.html'] = {
      type: 'file',
      size: 120,
      date: '18 Oct 19:02',
      content: '<html><body>Portal Interno</body></html>'
    };
    base['/home/ana/auditoria/web/acceso.log'] = {
      type: 'file',
      size: 320,
      date: '18 Oct 19:05',
      content: [
        '10:00 GET /index.html 200 OK - usuario: ana',
        '10:02 GET /panel 200 OK - usuario: carlos',
        '10:05 POST /login 403 FORBIDDEN - ALERTA: INTRUSO detectado desde IP 203.0.113.50'
      ].join('\n')
    };
    base['/home/ana/auditoria/seguridad'] = {
      type: 'dir',
      children: ['firewall.log']
    };
    base['/home/ana/auditoria/seguridad/firewall.log'] = {
      type: 'file',
      size: 390,
      date: '18 Oct 19:10',
      content: [
        '10:01 [OK] Tráfico interno permitido en eth0',
        '10:05 [CRITICO] INTRUSO bloqueado intentando abrir puerto 22 SSH',
        '10:06 [OK] Reglas de cortafuegos sincronizadas',
        '10:08 [CRITICO] INTRUSO intentó escalar privilegios con clave inválida'
      ].join('\n')
    };
  }

  return JSON.parse(JSON.stringify(base));
}

const CURRICULUM = [
  {
    id: '0.1',
    rutaId: 'intro',
    rutaTitulo: 'Introducción',
    codigo: 'Lección 0.1',
    titulo: '¿Qué es la terminal?',
    tipo: 'leccion',
    vfsPreset: 'ruta1',
    initialCwd: '/home/ana',
    parrafos: [
      '¡Bienvenido/a a LinuxLab! La terminal (o consola) no es una pantalla mágica para hackers de películas: es simplemente otra forma de conversar con tu computador mediante texto en lugar de hacer clics con el ratón.',
      'Observa el texto `ana@lab:~$` en la consola derecha. Eso se llama el **prompt** y te indica quién eres (`ana`), en qué máquina estás (`lab`), tu carpeta actual (`~` representa tu carpeta personal `/home/ana`) y el símbolo `$` que significa "estoy listo para recibir órdenes".',
      'Todo comando en Linux sigue una anatomía muy sencilla: `comando + opciones + argumentos`. Vamos a romper el hielo pidiéndole a la terminal que repita un saludo con el comando `echo`.'
    ],
    analogia: 'Usar la terminal es como enviarle un mensaje directo por chat al sistema operativo en vez de buscar botones en menús.',
    ejemploCmd: 'echo Hola Linux',
    objetivoTexto: 'Escribe y ejecuta el comando `echo Hola Linux` en la terminal para recibir tu primera respuesta del sistema.',
    pistas: [
      'El comando `echo` toma cualquier texto que escribas después de un espacio y lo muestra en pantalla.',
      'La estructura que debes escribir es: echo <espacio> Hola Linux',
      'echo Hola Linux'
    ],
    comandosAprendidos: ['echo'],
    validar: ({ history }) => {
      const ok = history.some((h) => {
        const clean = h.cmd.trim().replace(/\s+/g, ' ').toLowerCase();
        return clean === 'echo hola linux' || clean === 'echo "hola linux"' || clean === "echo 'hola linux'";
      });
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Fantástico! Acabas de ejecutar tu primer comando en Linux. Como ves, la terminal obedece al instante y sin complicaciones.'
          : 'Aún no has impreso el saludo exacto. Prueba escribiendo: echo Hola Linux'
      };
    }
  },
  {
    id: '0.2',
    rutaId: 'intro',
    rutaTitulo: 'Introducción',
    codigo: 'Lección 0.2',
    titulo: 'Diagnóstico inicial',
    tipo: 'diagnostico'
  },
  {
    id: '1.1',
    rutaId: 'ruta1',
    rutaTitulo: 'Ruta 1: Supervivencia básica',
    codigo: 'Lección 1.1',
    titulo: '¿Dónde estoy? (pwd)',
    tipo: 'leccion',
    vfsPreset: 'ruta1',
    initialCwd: '/home/ana',
    parrafos: [
      'En Linux, todos los archivos y carpetas viven dentro de un gran árbol invertido que nace en el **directorio raíz**, representado por una sola barra inclinada (`/`).',
      'Dentro de `/` existe la carpeta `/home`, y dentro de ella está tu espacio privado de trabajo: `/home/ana` (también abreviado con la virgulilla `~`).',
      'Cuando trabajas en la consola, la primera regla de supervivencia es saber siempre en qué rama del árbol estás parado/a. El comando `pwd` (Print Working Directory) te responde exactamente eso.'
    ],
    analogia: 'Ejecutar `pwd` equivale a mirar el cartel de "Usted está aquí" en el mapa de una estación de metro o leer la barra de ruta superior del Explorador de Windows/Finder.',
    ejemploCmd: 'pwd',
    objetivoTexto: 'Ejecuta el comando `pwd` en la terminal para verificar la ruta absoluta de tu directorio actual.',
    pistas: [
      'Recuerda las siglas en inglés de "Print Working Directory" (Imprimir Directorio de Trabajo).',
      'Es un comando de solo 3 letras sin opciones ni argumentos.',
      'pwd'
    ],
    comandosAprendidos: ['pwd'],
    validar: ({ history }) => {
      const ok = history.some((h) => h.cmd.trim() === 'pwd');
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Perfecto! La terminal respondió `/home/ana`. Ahora sabes cómo ubicarte en cualquier momento.'
          : 'Escribe `pwd` y presiona Enter para descubrir tu ubicación actual.'
      };
    }
  },
  {
    id: '1.2',
    rutaId: 'ruta1',
    rutaTitulo: 'Ruta 1: Supervivencia básica',
    codigo: 'Lección 1.2',
    titulo: 'Moverse por el árbol (cd)',
    tipo: 'leccion',
    vfsPreset: 'ruta1',
    initialCwd: '/home/ana',
    parrafos: [
      'Ahora que sabes dónde estás, aprendamos a caminar por las carpetas usando `cd` (Change Directory). Puedes indicarle el destino de dos maneras: con una **ruta relativa** (partiendo de donde estás, ej. `cd docs`) o con una **ruta absoluta** (empezando desde la raíz `/`, ej. `cd /home/ana/docs`).',
      'Además, `cd` tiene tres atajos súper útiles: `cd ..` sube un nivel hacia la carpeta padre, `cd ~` te devuelve de inmediato a `/home/ana` desde cualquier rincón, y `cd -` te regresa a la carpeta donde estabas justo antes.',
      'Observa el panel del "Árbol de directorios visual" debajo de la terminal: verás cómo la insignia `📍 TÚ ESTÁS AQUÍ` se mueve contigo en tiempo real.'
    ],
    analogia: 'Hacer `cd docs` es exactamente igual que hacer doble clic sobre la carpeta "docs" con el ratón. Hacer `cd ..` es presionar el botón "Atrás / Subir nivel".',
    ejemploCmd: 'cd docs',
    objetivoTexto: 'Desplázate dentro del directorio `/home/ana/docs` utilizando el comando `cd`.',
    pistas: [
      'Como ya estás en `/home/ana`, puedes usar una ruta relativa indicando solo el nombre de la carpeta destino, o la ruta completa.',
      'Escribe `cd` seguido de un espacio y el nombre de la carpeta `docs`.',
      'cd docs'
    ],
    comandosAprendidos: ['cd'],
    validar: ({ cwd }) => {
      const ok = cwd === '/home/ana/docs';
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Muy bien! Mira cómo cambió tu prompt a `ana@lab:~/docs$`. Ya estás dentro de la carpeta `docs`.'
          : `Actualmente estás en \`${cwd}\`. Usa \`cd docs\` o \`cd /home/ana/docs\` para entrar a la carpeta solicitada.`
      };
    }
  },
  {
    id: '1.3',
    rutaId: 'ruta1',
    rutaTitulo: 'Ruta 1: Supervivencia básica',
    codigo: 'Lección 1.3',
    titulo: 'Mirar alrededor (ls)',
    tipo: 'leccion',
    vfsPreset: 'ruta1',
    initialCwd: '/home/ana',
    parrafos: [
      'Entrar a una carpeta a ciegas no sirve de mucho si no podemos ver qué hay adentro. El comando `ls` (List) muestra los archivos y subdirectorios de tu ubicación actual.',
      'Sin embargo, `ls` por sí solo guarda un secreto: en Linux, cualquier archivo o carpeta cuyo nombre empiece con un punto (ej. `.config_secreta`) es un **archivo oculto** y no aparece en un listado normal.',
      'Si agregas la opción `-a` (`ls -a`), le ordenas mostrar absolutamente todo, incluidos los ocultos. Y si usas `ls -l` o `ls -la`, verás una tabla detallada con permisos, fechas y tamaños.'
    ],
    analogia: 'Usar `ls -a` equivale a activar la casilla "Mostrar elementos ocultos" en la pestaña Vista del explorador de archivos.',
    ejemploCmd: 'ls -a',
    objetivoTexto: 'Usa `ls -a` (o `ls -la`) dentro de `/home/ana` para revelar el archivo oculto `.config_secreta`.',
    pistas: [
      'Primero prueba `ls` a secas y notarás que `.config_secreta` no aparece. Necesitas añadirle la bandera de "all" (todos).',
      'Estructura: `ls` + espacio + `-a` (asegúrate de estar en `/home/ana`).',
      'ls -a'
    ],
    comandosAprendidos: ['ls'],
    validar: ({ history }) => {
      const ok = history.some((h) => {
        const c = h.cmd.trim();
        const usedA = /^ls\s+(-a|-la|-al)(\s+.*)?$/.test(c);
        const rightDir = h.cwdAfter === '/home/ana' || c.includes('/home/ana') || c.includes('~');
        return usedA && rightDir;
      });
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Ojo de águila! Ahí está `.config_secreta` junto a `.` (directorio actual) y `..` (directorio padre).'
          : 'Ejecuta `ls -a` o `ls -la` estando en `/home/ana` para descubrir el archivo oculto.'
      };
    }
  },
  {
    id: '1.4',
    rutaId: 'ruta1',
    rutaTitulo: 'Ruta 1: Supervivencia básica',
    codigo: 'Lección 1.4',
    titulo: 'Leer archivos sin miedo (cat, less, head, tail)',
    tipo: 'leccion',
    vfsPreset: 'ruta1',
    initialCwd: '/home/ana',
    parrafos: [
      'Para leer qué dice un archivo de texto en la terminal no necesitas abrir un programa pesado como Word. Tienes cuatro herramientas ligeras y100 % seguras porque solo leen el archivo sin modificarlo.',
      '`cat archivo` vuelca todo el texto en pantalla de una vez. Si el archivo es muy largo, `less archivo` lo muestra paginado; `head archivo` enseña solo las primeras líneas y `tail archivo` las últimas.',
      'Puedes leer un archivo entrando primero a su carpeta (`cd docs` y luego `cat pista.txt`) o pasándole su ruta relativa directamente (`cat docs/pista.txt`).'
    ],
    analogia: 'Es como usar la "Vista previa rápida" (barra espaciadora en Mac o panel de vista previa en Windows) para leer una nota al instante.',
    ejemploCmd: 'cat docs/pista.txt',
    objetivoTexto: 'Inspecciona el contenido del archivo `/home/ana/docs/pista.txt` usando `cat` (también puedes usar `less`, `head` o `tail`).',
    pistas: [
      'Puedes ejecutar el comando desde `/home/ana` apuntando a `docs/pista.txt`, o entrar primero con `cd docs` y leer `pista.txt`.',
      'Estructura: `cat <ruta_del_archivo>`',
      'cat /home/ana/docs/pista.txt'
    ],
    comandosAprendidos: ['cat', 'less', 'head', 'tail'],
    validar: ({ history }) => {
      const ok = history.some((h) => {
        const c = h.cmd.trim();
        const isReader = /^(cat|less|head|tail)\s+/.test(c);
        const hasOutput = h.output && h.output.includes('Pista de supervivencia');
        return isReader && hasOutput;
      });
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Lectura completada! Has descubierto la pista clave que te ayudará a superar el Reto 1.'
          : 'Aún no has leído el contenido de `pista.txt`. Prueba con `cat docs/pista.txt`.'
      };
    }
  },
  {
    id: 'reto1',
    rutaId: 'ruta1',
    rutaTitulo: 'Ruta 1: Supervivencia básica',
    codigo: 'Reto 1',
    titulo: 'Búsqueda del tesoro en el árbol de directorios',
    tipo: 'reto',
    vfsPreset: 'reto1',
    initialCwd: '/home/ana',
    escenario:
      '¡Hora de poner a prueba tus habilidades de supervivencia! Un docente dejó escondido un código secreto de acceso dentro de tu laboratorio. Sabemos que está oculto en algún lugar dentro de `/home/ana/proyectos`. Explora sin miedo: ninguno de los comandos de esta ruta puede dañar el sistema.',
    insigniaId: 'explorador',
    insigniaNombre: 'Explorador del sistema de archivos',
    comandosAprendidos: ['pwd', 'cd', 'ls', 'cat'],
    pistasReto: [
      'Empieza moviéndote a la carpeta de proyectos con `cd /home/ana/proyectos` (o `cd proyectos`).',
      'Una vez en `proyectos`, recuerda que los nombres que inician con punto están ocultos. Usa `ls -a` para ver la carpeta `.tesoro`.',
      'Entra con `cd .tesoro` y lee el archivo con `cat clave.txt`.'
    ],
    metasVisuales: [
      'Ubicarse en `/home/ana/proyectos` o subcarpeta `.tesoro`',
      'Descubrir el directorio oculto `/home/ana/proyectos/.tesoro` con `ls -a`',
      'Leer el contenido de `/home/ana/proyectos/.tesoro/clave.txt`'
    ],
    checklist: [
      {
        id: 'c1',
        texto: '1. Ir a la carpeta `/home/ana/proyectos` usando `cd`',
        check: ({ cwd, history }) =>
          cwd.startsWith('/home/ana/proyectos') ||
          history.some((h) => h.cwdAfter && h.cwdAfter.startsWith('/home/ana/proyectos'))
      },
      {
        id: 'c2',
        texto: '2. Listar los archivos ocultos con `ls -a` para descubrir la carpeta `.tesoro`',
        check: ({ history }) =>
          history.some((h) => h.output && h.output.includes('.tesoro'))
      },
      {
        id: 'c3',
        texto: '3. Entrar a `.tesoro` y leer el archivo `clave.txt` con `cat`',
        check: ({ history }) =>
          history.some((h) => h.output && h.output.includes('LINUX-MASTER-2026'))
      }
    ]
  },
  {
    id: '2.1',
    rutaId: 'ruta2',
    rutaTitulo: 'Ruta 2: Manipulación segura',
    codigo: 'Lección 2.1',
    titulo: 'Crear carpetas y archivos (mkdir, touch)',
    tipo: 'leccion',
    vfsPreset: 'ruta2_21',
    initialCwd: '/home/ana',
    parrafos: [
      '¡Bienvenido/a a la Ruta 2! Ya sabes explorar el sistema; ahora aprenderás a construir y organizar tu propio espacio de trabajo.',
      'Para crear una carpeta nueva usamos `mkdir nombre_carpeta` (Make Directory). Si necesitas crear una carpeta y dentro otra subcarpeta de un solo golpe (por ejemplo `mkdir -p proyecto/src`), la opción `-p` crea toda la ruta sin dar error.',
      'Por su parte, para crear un archivo vacío listo para trabajar usamos `touch nombre_archivo` (por ejemplo, `touch web/index.html`).'
    ],
    analogia: '`mkdir` es "Clic derecho › Nueva carpeta", y `touch` es "Clic derecho › Nuevo documento de texto en blanco".',
    ejemploCmd: 'mkdir web',
    objetivoTexto: 'Crea una carpeta llamada `web` dentro de `/home/ana` y dentro de ella crea un archivo vacío llamado `index.html`.',
    pistas: [
      'Necesitas dos pasos: primero crear el directorio `web` con `mkdir` y luego el archivo `index.html` dentro con `touch`.',
      'Ejecuta primero `mkdir web` y después `touch web/index.html` (o entra con `cd web` y haz `touch index.html`).',
      'mkdir web && touch web/index.html'
    ],
    comandosAprendidos: ['mkdir', 'touch'],
    validar: ({ vfs }) => {
      const hasDir = vfs['/home/ana/web'] && vfs['/home/ana/web'].type === 'dir';
      const hasFile = vfs['/home/ana/web/index.html'] && vfs['/home/ana/web/index.html'].type === 'file';
      const ok = Boolean(hasDir && hasFile);
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Excelente construcción! Has creado la carpeta `web` y su archivo `index.html` correctamente.'
          : hasDir
          ? 'Ya creaste la carpeta `web`. Ahora te falta crear el archivo `index.html` dentro de ella con `touch web/index.html`.'
          : 'Primero crea la carpeta `web` en `/home/ana` usando `mkdir web`.'
      };
    }
  },
  {
    id: '2.2',
    rutaId: 'ruta2',
    rutaTitulo: 'Ruta 2: Manipulación segura',
    codigo: 'Lección 2.2',
    titulo: 'Copiar, mover y renombrar (cp, mv)',
    tipo: 'leccion',
    vfsPreset: 'ruta2_22',
    initialCwd: '/home/ana',
    parrafos: [
      'Para duplicar un archivo usamos `cp origen destino` (Copy). Por ejemplo, `cp notas.txt docs/` crea una copia idéntica dentro de `docs` conservando el original. Si algún día quieres copiar una carpeta entera con todo su contenido, deberás añadir `-r` (`cp -r carpeta copia_carpeta`).',
      'En cambio, `mv origen destino` (Move) tiene un doble superpoder: si el destino es una carpeta existente, **mueve** el archivo hacia allá; pero si el destino es un nombre nuevo en la misma carpeta (ej. `mv borrador.txt final.txt`), simplemente **le cambia el nombre**.',
      'En esta práctica puedes elegir cualquiera de las dos misiones (¡o ambas!) para experimentar en el árbol visual.'
    ],
    analogia: '`cp` es Copiar y Pegar (Ctrl+C / Ctrl+V). `mv` es Cortar y Pegar (Ctrl+X / Ctrl+V) o pulsar F2 para renombrar un archivo.',
    ejemploCmd: 'cp notas.txt docs/',
    objetivoTexto: 'Copia `notas.txt` dentro de la carpeta `docs/` usando `cp`, O renombra el archivo `borrador.txt` a `final.txt` usando `mv`.',
    pistas: [
      'Recuerda que tanto `cp` como `mv` reciben primero el archivo de origen y luego el destino separados por un espacio.',
      'Para copiar: `cp notas.txt docs/` | Para renombrar: `mv borrador.txt final.txt`',
      'cp notas.txt docs/'
    ],
    comandosAprendidos: ['cp', 'mv'],
    validar: ({ vfs }) => {
      const copied = Boolean(vfs['/home/ana/docs/notas.txt'] && vfs['/home/ana/notas.txt']);
      const renamed = Boolean(vfs['/home/ana/final.txt'] && !vfs['/home/ana/borrador.txt']);
      const ok = copied || renamed;
      return {
        cumplido: ok,
        mensaje: ok
          ? copied
            ? '¡Muy bien! Has copiado `notas.txt` dentro de `docs/` manteniendo intacto el archivo original.'
            : '¡Perfecto! Has renombrado `borrador.txt` a `final.txt` limpiamente usando `mv`.'
          : 'Ejecuta `cp notas.txt docs/` para copiar el archivo, o `mv borrador.txt final.txt` para renombrarlo.'
      };
    }
  },
  {
    id: '2.3',
    rutaId: 'ruta2',
    rutaTitulo: 'Ruta 2: Manipulación segura',
    codigo: 'Lección 2.3',
    titulo: 'Borrar con cuidado y Modo Seguro (rm, rmdir)',
    tipo: 'leccion',
    vfsPreset: 'ruta2_23',
    initialCwd: '/home/ana',
    parrafos: [
      'Llegamos al comando que más respeto inspira en Linux: `rm` (Remove). A diferencia de Windows o macOS, cuando borras algo en la terminal con `rm`, **no va a la Papelera de reciclaje**: desaparece al instante.',
      'Por eso existen buenos hábitos profesionales: usar `rm -i archivo` para que la consola te pida confirmación antes de borrar, usar `rmdir` para borrar carpetas vacías con seguridad, y jamás ejecutar `rm -rf` a la ligera.',
      'En **LinuxLab** hemos integrado un **Modo Seguro Anti-ansiedad**: cada vez que uses `rm`, la terminal pausará la acción en amarillo y te preguntará `¿confirmas borrar <nombre>? [s/N]`. Escribe `s` y Enter para confirmar.'
    ],
    analogia: 'Usar `rm` con confirmación (`-i` o nuestro Modo Seguro) es como el cuadro de diálogo "¿Está seguro de que desea eliminar este elemento permanentemente?".',
    ejemploCmd: 'rm basura.tmp',
    objetivoTexto: 'Elimina únicamente el archivo `basura.tmp` con `rm basura.tmp` y confirma la operación escribiendo `s` en el Modo Seguro (sin borrar `importante.txt`).',
    pistas: [
      'Primero escribe el comando para borrar `basura.tmp` y presiona Enter.',
      'Verás un aviso amarillo del Modo Seguro pidiendo confirmación `[s/N]`. Escribe la letra `s` y presiona Enter.',
      'rm basura.tmp'
    ],
    comandosAprendidos: ['rm', 'rmdir'],
    validar: ({ vfs }) => {
      const trashGone = !vfs['/home/ana/basura.tmp'];
      const importantSafe = Boolean(vfs['/home/ana/importante.txt']);
      if (!importantSafe) {
        return {
          cumplido: false,
          mensaje: '¡Ups! Borraste `importante.txt` por accidente. No pasa nada: pulsa el botón «Reiniciar entorno» arriba de la terminal e inténtalo de nuevo.'
        };
      }
      return {
        cumplido: trashGone && importantSafe,
        mensaje: trashGone
          ? '¡Borrado quirúrgico y seguro! Eliminaste `basura.tmp` con confirmación manteniendo a salvo los archivos críticos.'
          : 'Elimina `basura.tmp` con `rm basura.tmp` y luego responde `s` cuando aparezca el aviso del Modo Seguro.'
      };
    }
  },
  {
    id: '2.4',
    rutaId: 'ruta2',
    rutaTitulo: 'Ruta 2: Manipulación segura',
    codigo: 'Lección 2.4',
    titulo: 'El poder de los comodines (* y ?)',
    tipo: 'leccion',
    vfsPreset: 'ruta2_24',
    initialCwd: '/home/ana',
    parrafos: [
      'Imagina tener 200 fotografías mezcladas con documentos y querer moverlas todas a una carpeta. Hacerlo una por una sería agotador. Aquí entran los **comodines (wildcards)**.',
      'El asterisco `*` representa "cualquier cantidad de caracteres". Así, `*.jpg` selecciona todos los archivos que terminen en `.jpg` (`foto1.jpg`, `foto2.jpg`, etc.). El signo `?` representa "exactamente un carácter" (ej. `foto?.jpg`).',
      '**Regla de oro de seguridad:** Antes de usar `*` con `mv` o `rm`, haz siempre una vista previa inocua con `ls *.jpg` para estar 100 % seguro de qué archivos estás seleccionando.'
    ],
    analogia: 'Usar `*.jpg` es como escribir ".jpg" en el filtro de una carpeta y presionar "Seleccionar todos los resultados" de una sola vez.',
    ejemploCmd: 'mv *.jpg imagenes',
    objetivoTexto: 'Mueve todos los archivos `.jpg` (`foto1.jpg` y `foto2.jpg`) dentro de la carpeta `imagenes/` en un solo comando usando comodines (`mv *.jpg imagenes`).',
    pistas: [
      'Puedes probar primero `ls *.jpg` para ver que selecciona `foto1.jpg` y `foto2.jpg`.',
      'Usa el comando `mv` seguido del patrón `*.jpg` y luego el nombre de la carpeta destino `imagenes`.',
      'mv *.jpg imagenes'
    ],
    comandosAprendidos: ['* (comodines)'],
    validar: ({ vfs }) => {
      const f1Moved = Boolean(vfs['/home/ana/imagenes/foto1.jpg'] && !vfs['/home/ana/foto1.jpg']);
      const f2Moved = Boolean(vfs['/home/ana/imagenes/foto2.jpg'] && !vfs['/home/ana/foto2.jpg']);
      const pdfStayed = Boolean(vfs['/home/ana/reporte.pdf']);
      const ok = f1Moved && f2Moved && pdfStayed;
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Magia pura! Moviste todas las fotografías en una sola línea sin tocar `reporte.pdf`.'
          : 'Asegúrate de mover tanto `foto1.jpg` como `foto2.jpg` a `/home/ana/imagenes` dejando `reporte.pdf` en su lugar.'
      };
    }
  },
  {
    id: 'reto2',
    rutaId: 'ruta2',
    rutaTitulo: 'Ruta 2: Manipulación segura',
    codigo: 'Reto 2',
    titulo: 'Ordena la carpeta descargas',
    tipo: 'reto',
    vfsPreset: 'reto2',
    initialCwd: '/home/ana/descargas',
    escenario:
      'El directorio `/home/ana/descargas` es un caos total: tiene fotos sueltas (`vacaciones.jpg`, `perfil.jpg`), un documento importante (`informe.pdf`) y un archivo basura (`temp.txt`). Tu misión es organizar la carpeta sin perder el informe PDF.',
    insigniaId: 'guardian',
    insigniaNombre: 'Guardián de la manipulación segura',
    comandosAprendidos: ['mkdir', 'touch', 'cp', 'mv', 'rm', 'rmdir', '*.jpg'],
    pistasReto: [
      'Verifica que estés en `/home/ana/descargas` (ya iniciamos ahí, puedes comprobarlo con `pwd`). Crea la carpeta con `mkdir fotos`.',
      'Para mover todas las imágenes de una vez usa el comodín: `mv *.jpg fotos`.',
      'Para eliminar el archivo temporal usa `rm temp.txt` y confirma escribiendo `s` cuando aparezca el Modo Seguro.'
    ],
    metasVisuales: [
      'Carpeta `/home/ana/descargas/fotos` creada',
      '`vacaciones.jpg` y `perfil.jpg` dentro de `fotos/`',
      '`temp.txt` eliminado de `descargas/`',
      '`informe.pdf` conservado a salvo en `descargas/`'
    ],
    checklist: [
      {
        id: 'r2_1',
        texto: '1. Crear la carpeta `fotos` dentro de `descargas` (`mkdir fotos`)',
        check: ({ vfs }) =>
          Boolean(vfs['/home/ana/descargas/fotos'] && vfs['/home/ana/descargas/fotos'].type === 'dir')
      },
      {
        id: 'r2_2',
        texto: '2. Mover todos los archivos `.jpg` a la carpeta `fotos` usando comodines (`mv *.jpg fotos`)',
        check: ({ vfs }) =>
          Boolean(
            vfs['/home/ana/descargas/fotos/vacaciones.jpg'] &&
              vfs['/home/ana/descargas/fotos/perfil.jpg'] &&
              !vfs['/home/ana/descargas/vacaciones.jpg'] &&
              !vfs['/home/ana/descargas/perfil.jpg']
          )
      },
      {
        id: 'r2_3',
        texto: '3. Borrar el archivo `temp.txt` confirmando en el Modo Seguro (`rm temp.txt` → `s`) conservando `informe.pdf`',
        check: ({ vfs }) =>
          Boolean(!vfs['/home/ana/descargas/temp.txt'] && vfs['/home/ana/descargas/informe.pdf'])
      }
    ]
  },
  {
    id: '3.1',
    rutaId: 'ruta3',
    rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
    codigo: 'Lección 3.1',
    titulo: 'Buscar archivos en el árbol (find)',
    tipo: 'leccion',
    vfsPreset: 'ruta3_31',
    initialCwd: '/home/ana',
    parrafos: [
      '¡Bienvenido/a a la Ruta 3! Cuando un servidor o proyecto crece, buscar archivos entrando carpeta por carpeta con `cd` y `ls` se vuelve imposible. Para eso existe el radar de Linux: el comando `find`.',
      'Su estructura es muy intuitiva: `find [dónde_buscar] -name "[patrón]"`. Si pones un punto (`.`) como lugar de búsqueda, `find` rastreará a partir de tu carpeta actual y todas sus subcarpetas automáticamente.',
      'Por ejemplo, `find . -name "*.txt"` recorrerá todas las ramas y te mostrará la ruta exacta de cada archivo terminado en `.txt`, sin importar qué tan profundo esté escondido.'
    ],
    analogia: 'Usar `find` es como escribir "*.txt" en el cuadro de búsqueda superior del explorador de archivos con la opción "Buscar en todas las subcarpetas" activada.',
    ejemploCmd: 'find . -name "*.txt"',
    objetivoTexto: 'Usa el comando `find` desde `/home/ana` para localizar todos los archivos `.txt` escondidos en las subcarpetas (`find . -name "*.txt"`).',
    pistas: [
      'Recuerda indicar primero la ruta donde buscar (`.` para el directorio actual o `/home/ana`) seguida de `-name` y el patrón entre comillas.',
      'Estructura: `find . -name "*.txt"`',
      'find . -name "*.txt"'
    ],
    comandosAprendidos: ['find'],
    validar: ({ history }) => {
      const ok = history.some(
        (h) =>
          h.cmd.trim().startsWith('find') &&
          h.output &&
          h.output.includes('claves_backup.txt')
      );
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Radar activado! Encontraste `claves_backup.txt` escondido dentro de `proyectos/backend/` sin tener que entrar carpeta por carpeta.'
          : 'Ejecuta `find . -name "*.txt"` para descubrir todos los archivos de texto del árbol.'
      };
    }
  },
  {
    id: '3.2',
    rutaId: 'ruta3',
    rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
    codigo: 'Lección 3.2',
    titulo: 'Filtrar contenido de texto (grep)',
    tipo: 'leccion',
    vfsPreset: 'ruta3_32',
    initialCwd: '/home/ana',
    parrafos: [
      'Mientras que `find` busca archivos por su nombre en las carpetas, `grep` busca **palabras o frases por dentro del contenido** de un archivo de texto.',
      'Imagina un archivo `servidor.log` con miles de líneas de actividad, pero a ti solo te interesan los errores. Si ejecutas `grep "ERROR" servidor.log`, la terminal ocultará el ruido y te mostrará únicamente las líneas que contengan esa palabra.',
      'Además, puedes agregar `-i` para ignorar mayúsculas/minúsculas (`grep -i "error" servidor.log`) o `-n` para ver el número exacto de línea donde ocurrió (`grep -n "ERROR" servidor.log`).'
    ],
    analogia: '`grep` es el equivalente a abrir un documento grande, presionar `Ctrl+F`, escribir "ERROR" y extraer una lista con solo los renglones donde aparece.',
    ejemploCmd: 'grep "ERROR" servidor.log',
    objetivoTexto: 'Filtra el archivo `servidor.log` usando `grep` para mostrar únicamente las líneas que contienen la palabra `ERROR`.',
    pistas: [
      'El comando `grep` recibe primero el texto buscado y luego el nombre del archivo donde buscar.',
      'Estructura: `grep "ERROR" servidor.log` (o `grep -n "ERROR" servidor.log`).',
      'grep "ERROR" servidor.log'
    ],
    comandosAprendidos: ['grep'],
    validar: ({ history }) => {
      const ok = history.some(
        (h) =>
          h.cmd.trim().startsWith('grep') &&
          h.output &&
          h.output.includes('Fallo de conexión con la base de datos') &&
          !h.output.includes('Usuario ana inició sesión')
      );
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Filtrado impecable! De 7 líneas de registro extrajiste al instante únicamente los 2 eventos de error.'
          : 'Usa `grep "ERROR" servidor.log` para aislar las líneas de error del registro.'
      };
    }
  },
  {
    id: '3.3',
    rutaId: 'ruta3',
    rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
    codigo: 'Lección 3.3',
    titulo: 'Conectar comandos con tuberías (|)',
    tipo: 'leccion',
    vfsPreset: 'ruta3_33',
    initialCwd: '/home/ana',
    parrafos: [
      'Aquí descubrirás la verdadera filosofía de Linux: combinar herramientas pequeñas para lograr tareas poderosas. El operador de **tubería o pipe (`|`)** toma la salida de texto del comando de la izquierda y la conecta directamente como entrada del comando de la derecha.',
      'Por ejemplo, si haces `ls -la | grep ".txt"`, el comando `ls -la` genera la lista de archivos y, en lugar de volcarla toda en pantalla, se la pasa por la tubería a `grep`, el cual deja pasar solo los renglones que tengan `.txt`.',
      'También puedes encadenar `cat servidor.log | grep "ERROR"` o `ls | head -n 3`.'
    ],
    analogia: 'Una tubería (`|`) es como acoplar un filtro purificador directamente a la salida del grifo de agua: lo que sale del primero se filtra en el segundo.',
    ejemploCmd: 'ls -la | grep ".txt"',
    objetivoTexto: 'Usa una tubería (`|`) para combinar `ls` (o `cat`) con `grep` (por ejemplo: `ls -la | grep ".txt"` o `cat servidor.log | grep "ERROR"`).',
    pistas: [
      'Escribe dos comandos separados por la barra vertical `|` (en muchos teclados se saca con AltGr + 1 o al lado de la tecla Enter/Shift).',
      'Puedes hacer clic en el bloque de ejemplo interactivo si no encuentras el símbolo `|` en tu teclado.',
      'ls -la | grep ".txt"'
    ],
    comandosAprendidos: ['|'],
    validar: ({ history }) => {
      const ok = history.some((h) => {
        const hasPipe = h.cmd.includes('|');
        const hasValidOut =
          h.output &&
          (h.output.includes('notas.txt') || h.output.includes('[ERROR]'));
        return hasPipe && hasValidOut;
      });
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Conexión maestra! Acabas de crear tu primera tubería de datos en Linux combinando dos programas.'
          : 'Ejecuta un comando con tubería como `ls -la | grep ".txt"` o `cat servidor.log | grep "ERROR"`.'
      };
    }
  },
  {
    id: '3.4',
    rutaId: 'ruta3',
    rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
    codigo: 'Lección 3.4',
    titulo: 'Guardar salidas en archivos (> y >>)',
    tipo: 'leccion',
    vfsPreset: 'ruta3_34',
    initialCwd: '/home/ana',
    parrafos: [
      'Hasta ahora, el resultado de todos tus comandos aparecía en la pantalla y luego se perdía. Con el operador de **redirección (`>`)** puedes capturar esa salida y guardarla automáticamente dentro de un archivo de texto nuevo.',
      'Existe una diferencia vital entre `>` y `>>`: un solo símbolo `>` **crea el archivo o sobrescribe (borra)** lo que hubiera antes en él; mientras que el doble símbolo `>>` **agrega el texto al final** respetando el contenido previo.',
      'Por ejemplo, `grep "ERROR" servidor.log > reporte_errores.txt` filtrará los errores y los dejará guardados en `reporte_errores.txt`.'
    ],
    analogia: 'Usar `>` es como elegir "Guardar como..." reemplazando el archivo, mientras que `>>` es abrir una libreta y escribir en el último renglón libre.',
    ejemploCmd: 'grep "ERROR" servidor.log > reporte_errores.txt',
    objetivoTexto: 'Filtra las líneas con `ERROR` de `servidor.log` y guárdalas en un archivo llamado `reporte_errores.txt` usando redirección (`>`).',
    pistas: [
      'Observa que al redirigir con `>`, la salida no se imprime en la pantalla porque va directo al archivo. ¡Verás cómo aparece `reporte_errores.txt` en el árbol de directorios!',
      'Estructura: `grep "ERROR" servidor.log > reporte_errores.txt`',
      'grep "ERROR" servidor.log > reporte_errores.txt'
    ],
    comandosAprendidos: ['>', '>>'],
    validar: ({ vfs }) => {
      const fileNode = vfs['/home/ana/reporte_errores.txt'];
      const ok = Boolean(
        fileNode &&
          fileNode.type === 'file' &&
          fileNode.content &&
          fileNode.content.includes('Certificado SSL')
      );
      return {
        cumplido: ok,
        mensaje: ok
          ? '¡Excelente! Has generado `reporte_errores.txt` automáticamente con los errores filtrados. Puedes hacer `cat reporte_errores.txt` para comprobarlo.'
          : 'Usa `grep "ERROR" servidor.log > reporte_errores.txt` para guardar los errores filtrados en el archivo.'
      };
    }
  },
  {
    id: 'reto3',
    rutaId: 'ruta3',
    rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
    codigo: 'Reto 3',
    titulo: 'Auditoría de registros del servidor',
    tipo: 'reto',
    vfsPreset: 'reto3',
    initialCwd: '/home/ana/auditoria',
    escenario:
      '¡Alerta de seguridad en el laboratorio! Se sospecha que alguien intentó acceder sin permiso a los servidores. Estás en `/home/ana/auditoria`, donde hay varias subcarpetas. Tu misión como auditor/a es localizar todos los archivos `.log`, filtrar los renglones que contengan la palabra `INTRUSO` y guardar la evidencia en `/home/ana/auditoria/evidencia.txt`.',
    insigniaId: 'maestro_flujo',
    insigniaNombre: 'Maestro del flujo y auditoría',
    comandosAprendidos: ['find', 'grep', '|', '>', '>>'],
    pistasReto: [
      'Paso 1: Ejecuta `find . -name "*.log"` para descubrir en qué subcarpetas están los registros (`web/acceso.log` y `seguridad/firewall.log`).',
      'Paso 2: Filtra los eventos sospechosos con `grep "INTRUSO" seguridad/firewall.log` o `grep "INTRUSO" web/acceso.log`.',
      'Paso 3: Guarda el resultado en `evidencia.txt` ejecutando: `grep "INTRUSO" seguridad/firewall.log > evidencia.txt`.'
    ],
    metasVisuales: [
      'Ejecutar `find` para localizar los archivos `.log` en las subcarpetas de `auditoria/`',
      'Inspeccionar o filtrar las líneas con la palabra `INTRUSO` usando `grep`',
      'Crear `/home/ana/auditoria/evidencia.txt` con las líneas de `INTRUSO` usando `>` o `>>`'
    ],
    checklist: [
      {
        id: 'r3_1',
        texto: '1. Localizar los archivos `.log` dentro de `auditoria` usando `find` (`find . -name "*.log"`)',
        check: ({ history }) =>
          history.some(
            (h) =>
              h.cmd.trim().startsWith('find') &&
              h.output &&
              h.output.includes('firewall.log')
          )
      },
      {
        id: 'r3_2',
        texto: '2. Filtrar las alertas que contienen la palabra `INTRUSO` usando `grep`',
        check: ({ history, vfs }) =>
          history.some(
            (h) =>
              h.cmd.includes('grep') &&
              h.cmd.toUpperCase().includes('INTRUSO')
          ) ||
          Boolean(
            vfs['/home/ana/auditoria/evidencia.txt'] &&
              vfs['/home/ana/auditoria/evidencia.txt'].content.includes('INTRUSO')
          )
      },
      {
        id: 'r3_3',
        texto: '3. Guardar las líneas filtradas con `INTRUSO` dentro de `/home/ana/auditoria/evidencia.txt` usando `>`',
        check: ({ vfs }) => {
          const ev = vfs['/home/ana/auditoria/evidencia.txt'];
          return Boolean(ev && ev.type === 'file' && ev.content && ev.content.includes('INTRUSO'));
        }
      }
    ]
  }
];

function resolvePath(cwd, targetPath, prevCwd = '/home/ana') {
  if (!targetPath || targetPath === '~') return '/home/ana';
  if (targetPath === '-') return prevCwd || '/home/ana';
  if (targetPath.startsWith('~/')) {
    targetPath = '/home/ana/' + targetPath.slice(2);
  }
  let raw = targetPath.startsWith('/') ? targetPath : `${cwd === '/' ? '' : cwd}/${targetPath}`;
  const parts = raw.split('/').filter(Boolean);
  const stack = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      stack.pop();
    } else {
      stack.push(part);
    }
  }
  return '/' + stack.join('/');
}

function getParentAndName(absPath) {
  if (absPath === '/') return { parent: null, name: '/' };
  const parts = absPath.split('/').filter(Boolean);
  const name = parts.pop();
  const parent = '/' + parts.join('/');
  return { parent, name };
}

function wildcardToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexStr = '^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
  return new RegExp(regexStr);
}

function expandWildcardArg(arg, cwd, vfs) {
  if (!arg.includes('*') && !arg.includes('?')) {
    return [arg];
  }
  let dirPart = '';
  let patternPart = arg;
  const lastSlash = arg.lastIndexOf('/');
  if (lastSlash !== -1) {
    dirPart = arg.slice(0, lastSlash) || '/';
    patternPart = arg.slice(lastSlash + 1);
  }
  const targetDirAbs = dirPart ? resolvePath(cwd, dirPart) : cwd;
  const dirNode = vfs[targetDirAbs];
  if (!dirNode || dirNode.type !== 'dir') {
    return [arg];
  }
  const regex = wildcardToRegex(patternPart);
  const includeHidden = patternPart.startsWith('.');
  const matches = dirNode.children.filter((childName) => {
    if (!includeHidden && childName.startsWith('.')) return false;
    return regex.test(childName);
  });
  if (matches.length === 0) return [arg];
  return matches.map((m) => (dirPart ? (dirPart === '/' ? `/${m}` : `${dirPart}/${m}`) : m));
}

function cloneTreeNode(vfs, srcAbs, dstAbs) {
  const srcNode = vfs[srcAbs];
  if (!srcNode) return;
  if (srcNode.type === 'file') {
    vfs[dstAbs] = { ...srcNode };
  } else if (srcNode.type === 'dir') {
    vfs[dstAbs] = { type: 'dir', children: [...srcNode.children] };
    for (const child of srcNode.children) {
      cloneTreeNode(vfs, `${srcAbs === '/' ? '' : srcAbs}/${child}`, `${dstAbs === '/' ? '' : dstAbs}/${child}`);
    }
  }
}

function deleteTreeNode(vfs, targetAbs) {
  const node = vfs[targetAbs];
  if (!node) return;
  if (node.type === 'dir') {
    for (const child of [...node.children]) {
      deleteTreeNode(vfs, `${targetAbs === '/' ? '' : targetAbs}/${child}`);
    }
  }
  const { parent, name } = getParentAndName(targetAbs);
  if (parent && vfs[parent] && vfs[parent].children) {
    vfs[parent].children = vfs[parent].children.filter((c) => c !== name);
  }
  delete vfs[targetAbs];
}

function executeBashSingle(rawCmd, state, stdin = null) {
  const { vfs: currentVfs, cwd, prevCwd } = state;
  const vfs = JSON.parse(JSON.stringify(currentVfs));
  const trimmed = rawCmd.trim();

  if (!trimmed) {
    return { vfs, cwd, prevCwd, output: '', status: 'ok', pendingRm: null, clearScreen: false };
  }

  // Tokenize preserving quotes
  const tokens = [];
  const tokenRegex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  let match;
  while ((match = tokenRegex.exec(trimmed)) !== null) {
    tokens.push(match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : match[0]);
  }

  const cmd = tokens[0];
  const rawArgs = tokens.slice(1);

  if (cmd === 'clear') {
    return { vfs, cwd, prevCwd, output: '', status: 'ok', pendingRm: null, clearScreen: true };
  }

  if (cmd === 'echo') {
    return {
      vfs,
      cwd,
      prevCwd,
      output: rawArgs.join(' '),
      status: 'ok',
      pendingRm: null
    };
  }

  if (cmd === 'pwd') {
    return {
      vfs,
      cwd,
      prevCwd,
      output: cwd,
      status: 'ok',
      pendingRm: null
    };
  }

  if (cmd === 'help') {
    const helpText = [
      'Comandos disponibles en LinuxLab (Bash Virtual v3.0 + Gemini IA):',
      '  pwd                        Muestra el directorio actual',
      '  cd [ruta]                  Cambia de directorio (soporta /, ~, .., -)',
      '  ls [-a|-l|-la]             Lista archivos y directorios',
      '  cat / less / head / tail   Muestra el contenido de un archivo',
      '  mkdir [-p] [carpeta]       Crea un nuevo directorio',
      '  touch [archivo]            Crea un archivo de texto vacío',
      '  cp [-r] [orig] [dst]       Copia archivos o directorios',
      '  mv [orig] [dst]            Mueve o renombra archivos/directorios (soporta *)',
      '  rm [-i|-r] [archivo]       Elimina archivos con Modo Seguro activo',
      '  rmdir [carpeta]            Elimina un directorio vacío',
      '  find [ruta] -name [patrón] Busca archivos y directorios recursivamente',
      '  grep [-i|-n] [txt] [arch]  Filtra líneas que contengan un patrón de texto',
      '  cmd1 | cmd2                Conecta la salida de cmd1 con la entrada de cmd2',
      '  cmd > arch / cmd >> arch   Guarda o añade la salida en un archivo de texto',
      '  man [comando]              Abre la ficha de ayuda de un comando',
      '  ai [tu pregunta]           Consulta al Tutor IA de Gemini en consola',
      '  clear                      Limpia la pantalla de la terminal'
    ].join('\n');
    return { vfs, cwd, prevCwd, output: helpText, status: 'ok', pendingRm: null };
  }

  if (cmd === 'man') {
    if (rawArgs.length === 0) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: '¿Qué página de manual deseas ver? Ejemplo: man ls',
        status: 'error',
        pendingRm: null
      };
    }
    const targetCmd = rawArgs[0].toLowerCase();
    const entry = GLOSARIO_DATA.find((g) => g.cmd === targetCmd);
    if (!entry) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: `No hay entrada de manual para ${targetCmd}. Usa 'help' para ver comandos disponibles.`,
        status: 'error',
        pendingRm: null
      };
    }
    const manOutput = [
      `MANUAL DE LINUXLAB: ${entry.cmd.toUpperCase()}(1)`,
      `NOMBRE:       ${entry.cmd} - ${entry.descripcion}`,
      `SINTAXIS:     ${entry.sintaxis}`,
      `OPCIONES:     ${entry.opciones.join(' | ')}`,
      `NIVEL RIESGO: ${entry.riesgo}`,
      `ANALOGÍA GUI: ${entry.analogia}`,
      `EJEMPLO:      ${entry.ejemplo}`
    ].join('\n');
    return { vfs, cwd, prevCwd, output: manOutput, status: 'ok', pendingRm: null };
  }

  if (cmd === 'cd') {
    const targetArg = rawArgs[0] || '~';
    const nextPath = resolvePath(cwd, targetArg, prevCwd);
    const node = vfs[nextPath];
    if (!node) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: `bash: cd: ${targetArg}: No existe el archivo o el directorio`,
        status: 'error',
        pendingRm: null
      };
    }
    if (node.type !== 'dir') {
      return {
        vfs,
        cwd,
        prevCwd,
        output: `bash: cd: ${targetArg}: No es un directorio`,
        status: 'error',
        pendingRm: null
      };
    }
    const outMsg = targetArg === '-' ? nextPath : '';
    return {
      vfs,
      cwd: nextPath,
      prevCwd: cwd,
      output: outMsg,
      status: 'ok',
      pendingRm: null
    };
  }

  if (cmd === 'ls') {
    let showHidden = false;
    let longFormat = false;
    const pathArgs = [];

    for (const arg of rawArgs) {
      if (arg.startsWith('-') && arg.length > 1) {
        if (arg.includes('a')) showHidden = true;
        if (arg.includes('l')) longFormat = true;
      } else {
        const expanded = expandWildcardArg(arg, cwd, vfs);
        pathArgs.push(...expanded);
      }
    }

    const targets = pathArgs.length > 0 ? pathArgs : ['.'];
    const outputs = [];
    let hasErr = false;

    for (const t of targets) {
      const abs = resolvePath(cwd, t);
      const node = vfs[abs];
      if (!node) {
        outputs.push(`ls: no se puede acceder a '${t}': No existe el archivo o el directorio`);
        hasErr = true;
        continue;
      }
      if (node.type === 'file') {
        const { name } = getParentAndName(abs);
        if (longFormat) {
          outputs.push(`-rw-r--r-- 1 ana ana ${String(node.size || 128).padStart(5, ' ')} ${node.date || '18 Oct 12:00'} ${name}`);
        } else {
          outputs.push(name);
        }
      } else if (node.type === 'dir') {
        let items = [...node.children];
        if (!showHidden) {
          items = items.filter((item) => !item.startsWith('.'));
        } else {
          items = ['.', '..', ...items];
        }
        if (longFormat) {
          const lines = [`total ${items.length * 4}`];
          for (const item of items) {
            if (item === '.' || item === '..') {
              lines.push(`drwxr-xr-x 2 ana ana  4096 18 Oct 09:00 ${item}/`);
            } else {
              const childAbs = `${abs === '/' ? '' : abs}/${item}`;
              const childNode = vfs[childAbs];
              const isDir = childNode && childNode.type === 'dir';
              const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
              const size = isDir ? ' 4096' : String((childNode && childNode.size) || 120).padStart(5, ' ');
              const date = (childNode && childNode.date) || '18 Oct 12:00';
              lines.push(`${perms} 1 ana ana ${size} ${date} ${item}${isDir ? '/' : ''}`);
            }
          }
          outputs.push(lines.join('\n'));
        } else {
          const formatted = items.map((item) => {
            if (item === '.' || item === '..') return item;
            const childAbs = `${abs === '/' ? '' : abs}/${item}`;
            const childNode = vfs[childAbs];
            return childNode && childNode.type === 'dir' ? `${item}/` : item;
          });
          outputs.push(formatted.join('   '));
        }
      }
    }

    return {
      vfs,
      cwd,
      prevCwd,
      output: outputs.join('\n'),
      status: hasErr ? 'error' : 'ok',
      pendingRm: null
    };
  }

  if (['cat', 'less', 'head', 'tail'].includes(cmd)) {
    let linesLimit = 10;
    const fileArgs = [];
    for (let i = 0; i < rawArgs.length; i++) {
      if (rawArgs[i] === '-n' && rawArgs[i + 1]) {
        linesLimit = parseInt(rawArgs[i + 1], 10) || 10;
        i++;
      } else if (!rawArgs[i].startsWith('-')) {
        fileArgs.push(rawArgs[i]);
      }
    }

    if (fileArgs.length === 0) {
      if (stdin !== null) {
        const allLines = String(stdin).split('\n');
        let pipedOut = String(stdin);
        if (cmd === 'head') pipedOut = allLines.slice(0, linesLimit).join('\n');
        else if (cmd === 'tail') pipedOut = allLines.slice(-linesLimit).join('\n');
        else if (cmd === 'less') pipedOut = `${stdin}\n(Visor paginado less - Fin de entrada)`;
        return { vfs, cwd, prevCwd, output: pipedOut, status: 'ok', pendingRm: null };
      }
      return {
        vfs,
        cwd,
        prevCwd,
        output: `${cmd}: falta el operando archivo`,
        status: 'error',
        pendingRm: null
      };
    }

    const combinedContents = [];
    for (const targetArg of fileArgs) {
      const abs = resolvePath(cwd, targetArg);
      const node = vfs[abs];

      if (!node) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `${cmd}: ${targetArg}: No existe el archivo o el directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      if (node.type === 'dir') {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `${cmd}: ${targetArg}: Es un directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      combinedContents.push(node.content || '');
    }

    const rawContent = combinedContents.join('\n');
    const allLines = rawContent.split('\n');
    let finalOut = rawContent;

    if (cmd === 'head') {
      finalOut = allLines.slice(0, linesLimit).join('\n');
    } else if (cmd === 'tail') {
      finalOut = allLines.slice(-linesLimit).join('\n');
    } else if (cmd === 'less') {
      finalOut = `${rawContent}\n(Visor paginado less: ${fileArgs[0]} - Fin del archivo)`;
    }

    return {
      vfs,
      cwd,
      prevCwd,
      output: finalOut,
      status: 'ok',
      pendingRm: null
    };
  }

  if (cmd === 'find') {
    let searchRootArg = '.';
    let namePattern = null;
    let typeFilter = null; // 'f' or 'd'

    for (let i = 0; i < rawArgs.length; i++) {
      const arg = rawArgs[i];
      if (arg === '-name' && rawArgs[i + 1] !== undefined) {
        namePattern = rawArgs[i + 1];
        i++;
      } else if (arg === '-type' && rawArgs[i + 1] !== undefined) {
        typeFilter = rawArgs[i + 1];
        i++;
      } else if (!arg.startsWith('-')) {
        searchRootArg = arg;
      }
    }

    const rootAbs = resolvePath(cwd, searchRootArg);
    const rootNode = vfs[rootAbs];
    if (!rootNode) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: `find: ‘${searchRootArg}’: No existe el archivo o el directorio`,
        status: 'error',
        pendingRm: null
      };
    }

    const regex = namePattern ? wildcardToRegex(namePattern) : null;
    const results = [];

    const formatFoundPath = (absPath) => {
      if (searchRootArg === '.' || searchRootArg === './') {
        if (absPath === rootAbs) return '.';
        const rel = absPath.slice(rootAbs === '/' ? 1 : rootAbs.length + 1);
        return `./${rel}`;
      }
      if (!searchRootArg.startsWith('/')) {
        const cleanPrefix = searchRootArg.replace(/\/+$/, '');
        if (absPath === rootAbs) return cleanPrefix;
        const rel = absPath.slice(rootAbs === '/' ? 1 : rootAbs.length + 1);
        return `${cleanPrefix}/${rel}`;
      }
      return absPath;
    };

    const traverse = (currAbs) => {
      const n = vfs[currAbs];
      if (!n) return;
      const { name } = getParentAndName(currAbs);
      const matchesType =
        !typeFilter ||
        (typeFilter === 'f' && n.type === 'file') ||
        (typeFilter === 'd' && n.type === 'dir');
      const matchesName = !regex || regex.test(name);

      if (matchesType && matchesName) {
        results.push(formatFoundPath(currAbs));
      }

      if (n.type === 'dir' && Array.isArray(n.children)) {
        for (const child of n.children) {
          traverse(`${currAbs === '/' ? '' : currAbs}/${child}`);
        }
      }
    };

    traverse(rootAbs);

    return {
      vfs,
      cwd,
      prevCwd,
      output: results.join('\n'),
      status: 'ok',
      pendingRm: null
    };
  }

  if (cmd === 'grep') {
    let ignoreCase = false;
    let showLineNum = false;
    const positional = [];

    for (const arg of rawArgs) {
      if (arg.startsWith('-') && arg.length > 1) {
        if (arg.includes('i')) ignoreCase = true;
        if (arg.includes('n')) showLineNum = true;
      } else {
        positional.push(arg);
      }
    }

    if (positional.length === 0) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'Uso: grep [OPCIONES] PATRÓN [ARCHIVO...]',
        status: 'error',
        pendingRm: null
      };
    }

    const pattern = positional[0];
    const targetFiles = positional.slice(1);
    const searchStr = ignoreCase ? pattern.toLowerCase() : pattern;

    const filterLinesFromText = (textContent, filePrefix = '') => {
      const lines = String(textContent).split('\n');
      const matched = [];
      lines.forEach((line, idx) => {
        const hay = ignoreCase ? line.toLowerCase() : line;
        if (hay.includes(searchStr)) {
          let prefix = '';
          if (filePrefix) prefix += `${filePrefix}:`;
          if (showLineNum) prefix += `${idx + 1}:`;
          matched.push(`${prefix}${line}`);
        }
      });
      return matched;
    };

    if (targetFiles.length === 0) {
      if (stdin !== null) {
        const matched = filterLinesFromText(stdin);
        return {
          vfs,
          cwd,
          prevCwd,
          output: matched.join('\n'),
          status: 'ok',
          pendingRm: null
        };
      }
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'grep: falta el archivo donde buscar (o conecta una entrada mediante tubería |)',
        status: 'error',
        pendingRm: null
      };
    }

    const expandedFiles = [];
    for (const f of targetFiles) {
      expandedFiles.push(...expandWildcardArg(f, cwd, vfs));
    }

    const allMatched = [];
    const showFilePrefix = expandedFiles.length > 1;

    for (const fArg of expandedFiles) {
      const abs = resolvePath(cwd, fArg);
      const node = vfs[abs];
      if (!node) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `grep: ${fArg}: No existe el archivo o el directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      if (node.type === 'dir') {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `grep: ${fArg}: Es un directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      allMatched.push(...filterLinesFromText(node.content || '', showFilePrefix ? fArg : ''));
    }

    return {
      vfs,
      cwd,
      prevCwd,
      output: allMatched.join('\n'),
      status: 'ok',
      pendingRm: null
    };
  }

  if (cmd === 'mkdir') {
    let parentsFlag = false;
    const dirArgs = [];
    for (const arg of rawArgs) {
      if (arg === '-p') parentsFlag = true;
      else if (!arg.startsWith('-')) dirArgs.push(arg);
    }

    if (dirArgs.length === 0) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'mkdir: falta un operando',
        status: 'error',
        pendingRm: null
      };
    }

    for (const dArg of dirArgs) {
      const abs = resolvePath(cwd, dArg);
      if (vfs[abs]) {
        if (!parentsFlag) {
          return {
            vfs,
            cwd,
            prevCwd,
            output: `mkdir: no se puede crear el directorio «${dArg}»: El archivo ya existe`,
            status: 'error',
            pendingRm: null
          };
        }
        continue;
      }

      if (parentsFlag) {
        const parts = abs.split('/').filter(Boolean);
        let curr = '';
        for (const p of parts) {
          const parentPath = curr || '/';
          curr = `${curr}/${p}`;
          if (!vfs[curr]) {
            vfs[curr] = { type: 'dir', children: [] };
            if (vfs[parentPath] && !vfs[parentPath].children.includes(p)) {
              vfs[parentPath].children.push(p);
            }
          }
        }
      } else {
        const { parent, name } = getParentAndName(abs);
        if (!parent || !vfs[parent] || vfs[parent].type !== 'dir') {
          return {
            vfs,
            cwd,
            prevCwd,
            output: `mkdir: no se puede crear el directorio «${dArg}»: No existe el directorio padre (usa mkdir -p)`,
            status: 'error',
            pendingRm: null
          };
        }
        vfs[abs] = { type: 'dir', children: [] };
        if (!vfs[parent].children.includes(name)) {
          vfs[parent].children.push(name);
        }
      }
    }

    return { vfs, cwd, prevCwd, output: '', status: 'ok', pendingRm: null };
  }

  if (cmd === 'touch') {
    const fileArgs = rawArgs.filter((a) => !a.startsWith('-'));
    if (fileArgs.length === 0) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'touch: falta un operando archivo',
        status: 'error',
        pendingRm: null
      };
    }

    for (const fArg of fileArgs) {
      const abs = resolvePath(cwd, fArg);
      if (vfs[abs]) {
        vfs[abs].date = '18 Oct Ahora';
        continue;
      }
      const { parent, name } = getParentAndName(abs);
      if (!parent || !vfs[parent] || vfs[parent].type !== 'dir') {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `touch: no se puede efectuar 'touch' sobre '${fArg}': No existe el directorio contenedor`,
          status: 'error',
          pendingRm: null
        };
      }
      vfs[abs] = {
        type: 'file',
        size: 0,
        date: '18 Oct Ahora',
        content: ''
      };
      if (!vfs[parent].children.includes(name)) {
        vfs[parent].children.push(name);
      }
    }

    return { vfs, cwd, prevCwd, output: '', status: 'ok', pendingRm: null };
  }

  if (cmd === 'cp') {
    let recursive = false;
    const itemArgs = [];
    for (const arg of rawArgs) {
      if (arg === '-r' || arg === '-R' || arg === '-rf') recursive = true;
      else if (!arg.startsWith('-')) {
        itemArgs.push(...expandWildcardArg(arg, cwd, vfs));
      }
    }

    if (itemArgs.length < 2) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'cp: falta el archivo de destino después del origen',
        status: 'error',
        pendingRm: null
      };
    }

    const destArg = itemArgs[itemArgs.length - 1];
    const sources = itemArgs.slice(0, -1);
    const destAbs = resolvePath(cwd, destArg);
    const destNode = vfs[destAbs];

    if (sources.length > 1 && (!destNode || destNode.type !== 'dir')) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: `cp: el objetivo '${destArg}' no es un directorio`,
        status: 'error',
        pendingRm: null
      };
    }

    for (const srcArg of sources) {
      const srcAbs = resolvePath(cwd, srcArg);
      const srcNode = vfs[srcAbs];
      if (!srcNode) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `cp: no se puede efectuar 'stat' sobre '${srcArg}': No existe el archivo o el directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      if (srcNode.type === 'dir' && !recursive) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `cp: se omite el directorio '${srcArg}' (usa cp -r para copiar directorios)`,
          status: 'error',
          pendingRm: null
        };
      }

      const { name: srcName } = getParentAndName(srcAbs);
      let finalDestAbs = destAbs;
      if (destNode && destNode.type === 'dir') {
        finalDestAbs = `${destAbs === '/' ? '' : destAbs}/${srcName}`;
      }

      const { parent: dstParent, name: dstName } = getParentAndName(finalDestAbs);
      if (!dstParent || !vfs[dstParent] || vfs[dstParent].type !== 'dir') {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `cp: no se puede crear '${destArg}': No existe el directorio`,
          status: 'error',
          pendingRm: null
        };
      }

      cloneTreeNode(vfs, srcAbs, finalDestAbs);
      if (!vfs[dstParent].children.includes(dstName)) {
        vfs[dstParent].children.push(dstName);
      }
    }

    return { vfs, cwd, prevCwd, output: '', status: 'ok', pendingRm: null };
  }

  if (cmd === 'mv') {
    const itemArgs = [];
    for (const arg of rawArgs) {
      if (!arg.startsWith('-')) {
        itemArgs.push(...expandWildcardArg(arg, cwd, vfs));
      }
    }

    if (itemArgs.length < 2) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'mv: falta el operando archivo de destino',
        status: 'error',
        pendingRm: null
      };
    }

    const destArg = itemArgs[itemArgs.length - 1];
    const sources = itemArgs.slice(0, -1);
    const destAbs = resolvePath(cwd, destArg);
    const destNode = vfs[destAbs];

    if (sources.length > 1 && (!destNode || destNode.type !== 'dir')) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: `mv: el objetivo '${destArg}' no es un directorio`,
        status: 'error',
        pendingRm: null
      };
    }

    for (const srcArg of sources) {
      const srcAbs = resolvePath(cwd, srcArg);
      const srcNode = vfs[srcAbs];
      if (!srcNode) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `mv: no se puede efectuar 'stat' sobre '${srcArg}': No existe el archivo o el directorio`,
          status: 'error',
          pendingRm: null
        };
      }

      const { name: srcName } = getParentAndName(srcAbs);
      let finalDestAbs = destAbs;
      if (destNode && destNode.type === 'dir') {
        finalDestAbs = `${destAbs === '/' ? '' : destAbs}/${srcName}`;
      }

      if (srcAbs === finalDestAbs) continue;

      const { parent: dstParent, name: dstName } = getParentAndName(finalDestAbs);
      if (!dstParent || !vfs[dstParent] || vfs[dstParent].type !== 'dir') {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `mv: no se puede mover '${srcArg}' a '${destArg}': No existe el directorio`,
          status: 'error',
          pendingRm: null
        };
      }

      cloneTreeNode(vfs, srcAbs, finalDestAbs);
      if (!vfs[dstParent].children.includes(dstName)) {
        vfs[dstParent].children.push(dstName);
      }
      deleteTreeNode(vfs, srcAbs);
    }

    return { vfs, cwd, prevCwd, output: '', status: 'ok', pendingRm: null };
  }

  if (cmd === 'rmdir') {
    const dirArgs = rawArgs.filter((a) => !a.startsWith('-'));
    if (dirArgs.length === 0) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'rmdir: falta un operando',
        status: 'error',
        pendingRm: null
      };
    }

    for (const dArg of dirArgs) {
      const abs = resolvePath(cwd, dArg);
      const node = vfs[abs];
      if (!node) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `rmdir: fallo al borrar '${dArg}': No existe el archivo o el directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      if (node.type !== 'dir') {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `rmdir: fallo al borrar '${dArg}': No es un directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      if (node.children.length > 0) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `rmdir: fallo al borrar '${dArg}': El directorio no está vacío`,
          status: 'error',
          pendingRm: null
        };
      }
      deleteTreeNode(vfs, abs);
    }

    return { vfs, cwd, prevCwd, output: '', status: 'ok', pendingRm: null };
  }

  if (cmd === 'rm') {
    let recursive = false;
    let force = false;
    const rawTargets = [];

    for (const arg of rawArgs) {
      if (arg.startsWith('-') && arg.length > 1) {
        if (arg.includes('r') || arg.includes('R')) recursive = true;
        if (arg.includes('f')) force = true;
      } else {
        rawTargets.push(arg);
      }
    }

    if (rawTargets.length === 0) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: 'rm: falta un operando',
        status: 'error',
        pendingRm: null
      };
    }

    // Intercept catastrophic commands pedagogically
    const joinedRaw = rawTargets.join(' ');
    const isCatastrophic =
      rawTargets.some((t) => ['/', '/*', '~', '~/*', '/home', '/home/ana', '*'].includes(t)) &&
      (recursive || force);

    if (isCatastrophic) {
      return {
        vfs,
        cwd,
        prevCwd,
        output: [
          `🛡 BLOQUEO PEDAGÓGICO DE MODO SEGURO: Has intentado ejecutar "${trimmed}".`,
          `¿Por qué lo detuvimos? En un sistema Linux real, combinar 'rm -rf' con '${joinedRaw}' destruye de forma instantánea e irreversible todo tu directorio o el sistema operativo entero sin pasar por la Papelera.`,
          `Consejo profesional: Especifica siempre el nombre exacto del archivo que deseas eliminar o usa 'rm -i'.`
        ].join('\n'),
        status: 'warning',
        pendingRm: null
      };
    }

    const expandedTargets = [];
    for (const t of rawTargets) {
      expandedTargets.push(...expandWildcardArg(t, cwd, vfs));
    }

    const resolvedTargets = [];
    for (const t of expandedTargets) {
      const abs = resolvePath(cwd, t);
      const node = vfs[abs];
      if (!node) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `rm: no se puede borrar '${t}': No existe el archivo o el directorio`,
          status: 'error',
          pendingRm: null
        };
      }
      if (node.type === 'dir' && !recursive) {
        return {
          vfs,
          cwd,
          prevCwd,
          output: `rm: no se puede borrar '${t}': Es un directorio (usa rmdir si está vacío o rm -r)`,
          status: 'error',
          pendingRm: null
        };
      }
      resolvedTargets.push({ label: t, abs });
    }

    const namesLabel = resolvedTargets.map((r) => r.label).join(', ');
    return {
      vfs,
      cwd,
      prevCwd,
      output: `⚠ Modo seguro: ¿confirmas borrar ${namesLabel}? [s/N]`,
      status: 'confirm',
      pendingRm: resolvedTargets
    };
  }

  return {
    vfs,
    cwd,
    prevCwd,
    output: `bash: ${cmd}: orden no encontrada. Escribe 'help' para ver los comandos disponibles.`,
    status: 'error',
    pendingRm: null
  };
}

function executeBashLine(rawLine, state) {
  // Support chaining with &&, pipes with |, and output redirection with > or >>
  const andSegments = rawLine.split('&&').map((p) => p.trim()).filter(Boolean);
  if (andSegments.length === 0) {
    return executeBashSingle('', state);
  }

  let currState = {
    vfs: JSON.parse(JSON.stringify(state.vfs)),
    cwd: state.cwd,
    prevCwd: state.prevCwd
  };
  const combinedOutputs = [];
  let finalStatus = 'ok';
  let pendingRm = null;
  let clearScreen = false;

  for (const segment of andSegments) {
    // Check if there is redirection (>> or >) outside quotes
    let cmdPipelinePart = segment;
    let redirectMode = null; // 'overwrite' | 'append'
    let redirectTarget = null;

    const appendMatch = segment.match(/^(.*?)\s*>>\s*([^\s"'>|]+|"[^"]+"|'[^']+')\s*$/);
    const overwriteMatch = !appendMatch && segment.match(/^(.*?)\s*>\s*([^\s"'>|]+|"[^"]+"|'[^']+')\s*$/);

    if (appendMatch) {
      cmdPipelinePart = appendMatch[1].trim();
      redirectTarget = appendMatch[2].replace(/^['"]|['"]$/g, '');
      redirectMode = 'append';
    } else if (overwriteMatch) {
      cmdPipelinePart = overwriteMatch[1].trim();
      redirectTarget = overwriteMatch[2].replace(/^['"]|['"]$/g, '');
      redirectMode = 'overwrite';
    }

    // Split pipeline stages by | outside quotes
    const pipeStages = [];
    let currentStage = '';
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < cmdPipelinePart.length; i++) {
      const ch = cmdPipelinePart[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (ch === '|' && !inSingle && !inDouble) {
        pipeStages.push(currentStage.trim());
        currentStage = '';
        continue;
      }
      currentStage += ch;
    }
    if (currentStage.trim()) {
      pipeStages.push(currentStage.trim());
    }

    let pipeInput = null;
    let stageStatus = 'ok';
    let stageOutput = '';

    for (const stageCmd of pipeStages) {
      const res = executeBashSingle(stageCmd, currState, pipeInput);
      currState = { vfs: res.vfs, cwd: res.cwd, prevCwd: res.prevCwd };
      if (res.clearScreen) clearScreen = true;
      stageOutput = res.output || '';
      stageStatus = res.status;
      if (res.pendingRm) pendingRm = res.pendingRm;

      if (stageStatus !== 'ok') {
        break;
      }
      pipeInput = stageOutput;
    }

    if (stageStatus !== 'ok') {
      if (stageOutput) combinedOutputs.push(stageOutput);
      finalStatus = stageStatus;
      break;
    }

    // Handle output redirection (> or >>) if requested
    if (redirectMode && redirectTarget) {
      const targetAbs = resolvePath(currState.cwd, redirectTarget);
      const existingNode = currState.vfs[targetAbs];
      if (existingNode && existingNode.type === 'dir') {
        combinedOutputs.push(`bash: ${redirectTarget}: Es un directorio`);
        finalStatus = 'error';
        break;
      }
      const { parent, name } = getParentAndName(targetAbs);
      if (!parent || !currState.vfs[parent] || currState.vfs[parent].type !== 'dir') {
        combinedOutputs.push(`bash: ${redirectTarget}: No existe el archivo o el directorio`);
        finalStatus = 'error';
        break;
      }

      const prevContent =
        redirectMode === 'append' && existingNode && existingNode.content
          ? existingNode.content + '\n'
          : '';
      const newContent = prevContent + stageOutput;

      currState.vfs[targetAbs] = {
        type: 'file',
        size: newContent.length,
        date: '18 Oct Ahora',
        content: newContent
      };
      if (!currState.vfs[parent].children.includes(name)) {
        currState.vfs[parent].children.push(name);
      }
    } else if (stageOutput) {
      combinedOutputs.push(stageOutput);
    }
  }

  return {
    vfs: currState.vfs,
    cwd: currState.cwd,
    prevCwd: currState.prevCwd,
    output: combinedOutputs.join('\n'),
    status: finalStatus,
    pendingRm,
    clearScreen
  };
}

function DirectoryTreePanel({ vfs, cwd, showHiddenFiles, onToggleHidden }) {
  const renderNode = (absPath, depth = 0) => {
    const node = vfs[absPath];
    if (!node) return null;
    const { name } = getParentAndName(absPath);
    const isCurrentCwd = cwd === absPath;
    const isHidden = name.startsWith('.') && name !== '/';

    if (isHidden && !showHiddenFiles) return null;

    if (node.type === 'file') {
      return (
        <div
          key={absPath}
          style={{ paddingLeft: `${depth * 16}px` }}
          className="flex items-center gap-2 py-1 px-2 rounded text-xs font-mono text-slate-300 hover:bg-slate-800/60 transition-colors"
        >
          <FileText className={`w-3.5 h-3.5 shrink-0 ${isHidden ? 'text-amber-400' : 'text-sky-400'}`} />
          <span className={isHidden ? 'text-amber-300 italic' : 'text-slate-200'}>{name}</span>
          {isHidden && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              oculto
            </span>
          )}
        </div>
      );
    }

    return (
      <div key={absPath}>
        <div
          style={{ paddingLeft: `${depth * 16}px` }}
          className={`flex items-center justify-between py-1 px-2 rounded text-xs font-mono transition-colors ${
            isCurrentCwd
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
              : 'text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isCurrentCwd ? (
              <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Folder className={`w-4 h-4 shrink-0 ${isHidden ? 'text-amber-400' : 'text-indigo-400'}`} />
            )}
            <span className="truncate">{name === '/' ? '/ (raíz)' : `${name}/`}</span>
            {isHidden && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                oculto
              </span>
            )}
          </div>
          {isCurrentCwd && (
            <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-emerald-500 text-slate-950 font-bold tracking-tight shrink-0">
              📍 ana está aquí
            </span>
          )}
        </div>
        <div>
          {node.children.map((childName) =>
            renderNode(`${absPath === '/' ? '' : absPath}/${childName}`, depth + 1)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Árbol de Directorios en Tiempo Real
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleHidden}
          className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
            showHiddenFiles
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          {showHiddenFiles ? 'Ocultos visibles (.*)' : 'Mostrar ocultos (.*)'}
        </button>
      </div>
      <div className="max-h-56 overflow-y-auto pr-1 space-y-0.5">{renderNode('/home/ana', 0)}</div>
    </div>
  );
}

function WelcomeAnimatedTerminal() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl bg-[#121417] font-mono text-sm">
      <div className="bg-slate-800/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-xs text-slate-400">ana@lab: ~ (Simulador seguro interactivo)</span>
        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          Modo Seguro ON
        </span>
      </div>
      <div className="p-5 space-y-2.5 min-h-[210px] text-slate-200">
        <div>
          <span className="text-emerald-400 font-semibold">ana@lab</span>
          <span className="text-slate-400">:</span>
          <span className="text-sky-400 font-semibold">~</span>
          <span className="text-slate-300">$ </span>
          <span className="text-white">ls</span>
        </div>
        {step >= 1 && (
          <div className="text-indigo-300 pl-2">docs/   proyectos/   notas.txt</div>
        )}
        {step >= 2 && (
          <div>
            <span className="text-emerald-400 font-semibold">ana@lab</span>
            <span className="text-slate-400">:</span>
            <span className="text-sky-400 font-semibold">~</span>
            <span className="text-slate-300">$ </span>
            <span className="text-white">cd proyectos</span>
          </div>
        )}
        {step >= 3 && (
          <div>
            <span className="text-emerald-400 font-semibold">ana@lab</span>
            <span className="text-slate-400">:</span>
            <span className="text-sky-400 font-semibold">~/proyectos</span>
            <span className="text-slate-300">$ </span>
            <span className="text-white">echo "¡La terminal es mi aliada!"</span>
          </div>
        )}
        {step >= 4 && (
          <div className="text-emerald-300 pl-2">¡La terminal es mi aliada!</div>
        )}
        <div className="pt-1 flex items-center">
          <span className="text-emerald-400 font-semibold">ana@lab</span>
          <span className="text-slate-400">:</span>
          <span className="text-sky-400 font-semibold">{step >= 2 ? '~/proyectos' : '~'}</span>
          <span className="text-slate-300">$ </span>
          <span className="ml-1 inline-block w-2.5 h-4 bg-emerald-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const STORAGE_KEY = 'linuxlab_pmv_progress_v1';

  const defaultProgress = {
    diagnosticoCompletado: false,
    diagnosticoOmitido: false,
    diagnosticoPuntaje: 0,
    completedIds: [],
    unlockedRuta2: false,
    unlockedRuta3: false,
    badges: [],
    learnedCommands: [],
    reviewerMode: false
  };

  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...defaultProgress, ...JSON.parse(saved) } : defaultProgress;
    } catch {
      return defaultProgress;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  // Screens: P0 (Bienvenida), P1 (Diagnóstico), P2 (Mapa), P3_P4 (Lección), P5 (Reto), P6 (Resumen/Insignia), P7 (Mi Progreso), P8 (Glosario)
  const [screen, setScreen] = useState('P0');
  const [activeActivityId, setActiveActivityId] = useState('0.1');
  const [summaryRouteId, setSummaryRouteId] = useState('ruta1');
  const [showRuta3Modal, setShowRuta3Modal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCheatsheetModal, setShowCheatsheetModal] = useState(false);

  // Diagnostic quiz state (P1)
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Glossary filter state (P8)
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [glossaryCategory, setGlossaryCategory] = useState('Todas');

  // Interactive Terminal & VFS state for P3/P4 & P5
  const activeActivity = useMemo(
    () => CURRICULUM.find((item) => item.id === activeActivityId) || CURRICULUM[0],
    [activeActivityId]
  );

  const [vfs, setVfs] = useState(() => createBaseVFS('ruta1'));
  const [cwd, setCwd] = useState('/home/ana');
  const [prevCwd, setPrevCwd] = useState('/home/ana');
  const [termLines, setTermLines] = useState([]);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyCursor, setHistoryCursor] = useState(-1);
  const [inputVal, setInputVal] = useState('');
  const [pendingRm, setPendingRm] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [showHiddenTree, setShowHiddenTree] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Responsive accordion toggles
  const [openTheoryAcc, setOpenTheoryAcc] = useState(true);
  const [openTreeAcc, setOpenTreeAcc] = useState(true);

  // Gemini AI Tutor & Features State
  const [showAiLabModal, setShowAiLabModal] = useState(false);
  const [aiTutorMessages, setAiTutorMessages] = useState([
    {
      role: 'assistant',
      text: '¡Hola! Soy tu Tutor IA de LinuxLab impulsado por Gemini. Puedo explicarte cualquier error de tu terminal, darte pistas socráticas sobre tu lección actual o desglosar comandos complejos.'
    }
  ]);
  const [aiTutorInput, setAiTutorInput] = useState('');
  const [aiTutorLoading, setAiTutorLoading] = useState(false);
  const [aiTerminalLoading, setAiTerminalLoading] = useState(false);

  // NL2Bash Structured Command Analyzer State
  const [aiAnatomyQuery, setAiAnatomyQuery] = useState('');
  const [aiAnatomyResult, setAiAnatomyResult] = useState(null);
  const [aiAnatomyLoading, setAiAnatomyLoading] = useState(false);
  const [aiAnatomyError, setAiAnatomyError] = useState(null);

  // Dynamic AI Diagnostic Questions & Progress Report State
  const [extraQuizQuestions, setExtraQuizQuestions] = useState([]);
  const [aiGeneratingQuestion, setAiGeneratingQuestion] = useState(false);
  const [aiProgressReport, setAiProgressReport] = useState('');
  const [aiReportLoading, setAiReportLoading] = useState(false);

  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize environment when switching lesson or challenge
  const initActivityEnvironment = (activity) => {
    if (!activity || activity.tipo === 'diagnostico') return;
    const freshVfs = createBaseVFS(activity.vfsPreset || 'ruta1');
    const startCwd = activity.initialCwd || '/home/ana';
    setVfs(freshVfs);
    setCwd(startCwd);
    setPrevCwd(startCwd);
    setPendingRm(null);
    setHintLevel(0);
    setInputVal('');
    setHistoryCursor(-1);
    setCmdHistory([]);
    setShowHiddenTree(false);
    setFeedbackBanner({
      type: 'info',
      text: `Entorno virtual cargado para ${activity.codigo}: «${activity.titulo}». Escribe un comando y presiona Enter.`
    });
    setTermLines([
      {
        type: 'system',
        text: `LinuxLab Virtual Bash — Entorno aislado para ${activity.codigo} (${activity.titulo}). Modo Seguro Activo.`
      }
    ]);
  };

  const openActivity = (id) => {
    const item = CURRICULUM.find((c) => c.id === id);
    if (!item) return;
    setActiveActivityId(id);
    if (item.tipo === 'diagnostico') {
      setScreen('P1');
    } else if (item.tipo === 'reto') {
      initActivityEnvironment(item);
      setScreen('P5');
    } else {
      initActivityEnvironment(item);
      setScreen('P3_P4');
    }
  };

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [termLines]);

  const isActivityUnlocked = (id) => {
    if (progress.reviewerMode) return true;
    if (id === '0.1' || id === '0.2' || id === '1.1') return true;

    const orderRuta1 = ['1.1', '1.2', '1.3', '1.4', 'reto1'];
    const idx1 = orderRuta1.indexOf(id);
    if (idx1 > 0) {
      return progress.completedIds.includes(orderRuta1[idx1 - 1]);
    }

    const orderRuta2 = ['2.1', '2.2', '2.3', '2.4', 'reto2'];
    const idx2 = orderRuta2.indexOf(id);
    if (idx2 === 0) {
      return progress.unlockedRuta2 || progress.completedIds.includes('reto1');
    }
    if (idx2 > 0) {
      return progress.completedIds.includes(orderRuta2[idx2 - 1]);
    }

    const orderRuta3 = ['3.1', '3.2', '3.3', '3.4', 'reto3'];
    const idx3 = orderRuta3.indexOf(id);
    if (idx3 === 0) {
      return progress.unlockedRuta3 || progress.completedIds.includes('reto2');
    }
    if (idx3 > 0) {
      return progress.completedIds.includes(orderRuta3[idx3 - 1]);
    }

    return false;
  };

  const markActivityCompleted = (activity) => {
    setProgress((prev) => {
      const completedIds = prev.completedIds.includes(activity.id)
        ? prev.completedIds
        : [...prev.completedIds, activity.id];
      const learnedCommands = Array.from(
        new Set([...prev.learnedCommands, ...(activity.comandosAprendidos || [])])
      );
      let badges = [...prev.badges];
      let unlockedRuta2 = prev.unlockedRuta2;
      let unlockedRuta3 = prev.unlockedRuta3;

      if (activity.id === 'reto1') {
        unlockedRuta2 = true;
        if (!badges.includes('explorador')) badges.push('explorador');
      }
      if (activity.id === 'reto2') {
        unlockedRuta3 = true;
        if (!badges.includes('guardian')) badges.push('guardian');
      }
      if (activity.id === 'reto3') {
        if (!badges.includes('maestro_flujo')) badges.push('maestro_flujo');
      }

      return {
        ...prev,
        completedIds,
        learnedCommands,
        badges,
        unlockedRuta2,
        unlockedRuta3
      };
    });
  };

  const handleCommandSubmit = (e) => {
    if (e) e.preventDefault();
    const raw = inputVal;
    const trimmed = raw.trim();
    setInputVal('');
    setHistoryCursor(-1);

    const promptDisplay = cwd.startsWith('/home/ana')
      ? `~${cwd.slice('/home/ana'.length)}`
      : cwd;

    // Check if we are waiting for Interactive Safe Mode confirmation [s/N]
    if (pendingRm) {
      const ans = trimmed.toLowerCase();
      const newLines = [
        ...termLines,
        { type: 'input', prompt: promptDisplay, text: raw }
      ];

      if (ans === 's' || ans === 'si' || ans === 'sí' || ans === 'y') {
        const nextVfs = JSON.parse(JSON.stringify(vfs));
        for (const item of pendingRm) {
          deleteTreeNode(nextVfs, item.abs);
        }
        const deletedNames = pendingRm.map((p) => p.label).join(', ');
        newLines.push({
          type: 'success',
          text: `✔ Modo seguro: Confirmado. Se eliminó '${deletedNames}' de forma segura.`
        });
        const updatedHistory = [
          ...cmdHistory,
          { cmd: `rm ${deletedNames} [confirmado]`, cwdAfter: cwd, output: 'deleted' }
        ];
        setVfs(nextVfs);
        setPendingRm(null);
        setTermLines(newLines);
        setCmdHistory(updatedHistory);
        evaluateCurrentActivity(nextVfs, cwd, updatedHistory);
      } else {
        newLines.push({
          type: 'warning',
          text: `✖ Modo seguro: Operación cancelada. Tus archivos siguen intactos.`
        });
        setPendingRm(null);
        setTermLines(newLines);
      }
      return;
    }

    // Intercept `ai` or `ask` command in the virtual terminal to query Gemini LLM
    if (trimmed === 'ai' || trimmed.startsWith('ai ') || trimmed === 'ask' || trimmed.startsWith('ask ')) {
      const questionText = trimmed.replace(/^(ai|ask)\s*/i, '').trim();
      const nextLines = [
        ...termLines,
        { type: 'input', prompt: promptDisplay, text: raw }
      ];

      if (!questionText) {
        nextLines.push({
          type: 'warning',
          text: '✨ Uso del asistente en consola: escribe `ai <tu duda>` (ejemplo: `ai cómo veo archivos ocultos` o `ai por qué dio error mi comando anterior`).'
        });
        setTermLines(nextLines);
        return;
      }

      setTermLines([
        ...nextLines,
        { type: 'system', text: '✨ Consultando al Tutor IA Gemini en tiempo real...' }
      ]);
      setAiTerminalLoading(true);

      askContextualLinuxTutor({
        userQuestion: questionText,
        activity: activeActivity,
        cwd,
        vfs,
        cmdHistory
      })
        .then((aiResponse) => {
          setTermLines((prev) => [
            ...prev.filter((l) => l.text !== '✨ Consultando al Tutor IA Gemini en tiempo real...'),
            {
              type: 'ai',
              text: `🤖 Tutor IA Gemini:\n${aiResponse}`
            }
          ]);
        })
        .catch(() => {
          setTermLines((prev) => [
            ...prev.filter((l) => l.text !== '✨ Consultando al Tutor IA Gemini en tiempo real...'),
            {
              type: 'error',
              text: 'No se pudo conectar con el Tutor IA en este momento. Intenta de nuevo en unos segundos.'
            }
          ]);
        })
        .finally(() => {
          setAiTerminalLoading(false);
        });
      return;
    }

    const res = executeBashLine(raw, { vfs, cwd, prevCwd });

    if (res.clearScreen) {
      setTermLines([]);
      return;
    }

    const nextLines = [
      ...termLines,
      { type: 'input', prompt: promptDisplay, text: raw }
    ];

    if (res.output) {
      nextLines.push({
        type: res.status === 'error' ? 'error' : res.status === 'confirm' || res.status === 'warning' ? 'warning' : 'output',
        text: res.output
      });
    }

    // Reveal hidden files in visual tree automatically if user runs ls -a / ls -la
    if (/^ls\s+(-a|-la|-al)/.test(trimmed)) {
      setShowHiddenTree(true);
    }

    const nextHistory = trimmed
      ? [...cmdHistory, { cmd: trimmed, cwdAfter: res.cwd, output: res.output }]
      : cmdHistory;

    setVfs(res.vfs);
    setCwd(res.cwd);
    setPrevCwd(res.prevCwd);
    setPendingRm(res.pendingRm);
    setTermLines(nextLines);
    setCmdHistory(nextHistory);

    evaluateCurrentActivity(res.vfs, res.cwd, nextHistory);
  };

  const evaluateCurrentActivity = (currVfs, currCwd, currHistory) => {
    if (!activeActivity) return;

    if (activeActivity.tipo === 'leccion' && activeActivity.validar) {
      const result = activeActivity.validar({
        vfs: currVfs,
        cwd: currCwd,
        history: currHistory
      });
      if (result.cumplido) {
        markActivityCompleted(activeActivity);
        setFeedbackBanner({ type: 'success', text: result.mensaje });
      } else {
        setFeedbackBanner({ type: 'pending', text: result.mensaje });
      }
    } else if (activeActivity.tipo === 'reto' && activeActivity.checklist) {
      const allDone = activeActivity.checklist.every((item) =>
        item.check({ vfs: currVfs, cwd: currCwd, history: currHistory })
      );
      if (allDone) {
        markActivityCompleted(activeActivity);
        setFeedbackBanner({
          type: 'success',
          text: `¡Reto superado al 100 %! Has desbloqueado la insignia «${activeActivity.insigniaNombre}». Pulsa «Validar y reclamar insignia».`
        });
      }
    }
  };

  const handleTerminalKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyCursor === -1 ? cmdHistory.length - 1 : Math.max(0, historyCursor - 1);
      setHistoryCursor(nextIdx);
      setInputVal(cmdHistory[nextIdx].cmd.replace(' [confirmado]', ''));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyCursor === -1) return;
      if (historyCursor + 1 >= cmdHistory.length) {
        setHistoryCursor(-1);
        setInputVal('');
      } else {
        const nextIdx = historyCursor + 1;
        setHistoryCursor(nextIdx);
        setInputVal(cmdHistory[nextIdx].cmd.replace(' [confirmado]', ''));
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = inputVal.split(' ');
      if (parts.length === 1) {
        const cmds = ['echo', 'pwd', 'cd', 'ls', 'cat', 'less', 'head', 'tail', 'mkdir', 'touch', 'cp', 'mv', 'rm', 'rmdir', 'find', 'grep', 'help', 'man', 'ai', 'clear'];
        const matches = cmds.filter((c) => c.startsWith(parts[0]));
        if (matches.length === 1) setInputVal(matches[0] + ' ');
      } else {
        const lastToken = parts[parts.length - 1];
        const slashIdx = lastToken.lastIndexOf('/');
        const dirPrefix = slashIdx !== -1 ? lastToken.slice(0, slashIdx + 1) : '';
        const partial = slashIdx !== -1 ? lastToken.slice(slashIdx + 1) : lastToken;
        const searchDir = dirPrefix ? resolvePath(cwd, dirPrefix) : cwd;
        const dirNode = vfs[searchDir];
        if (dirNode && dirNode.type === 'dir') {
          const matches = dirNode.children.filter((c) => c.startsWith(partial));
          if (matches.length === 1) {
            const matchedName = matches[0];
            const matchedAbs = `${searchDir === '/' ? '' : searchDir}/${matchedName}`;
            const isDir = vfs[matchedAbs] && vfs[matchedAbs].type === 'dir';
            parts[parts.length - 1] = `${dirPrefix}${matchedName}${isDir ? '/' : ''}`;
            setInputVal(parts.join(' '));
          }
        }
      }
    }
  };

  const insertExampleCommand = (cmdText) => {
    setInputVal(cmdText);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1400);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSendTutorQuestion = async (customPrompt) => {
    const queryText = (customPrompt || aiTutorInput).trim();
    if (!queryText || aiTutorLoading) return;
    if (!customPrompt) setAiTutorInput('');

    setAiTutorMessages((prev) => [...prev, { role: 'user', text: queryText }]);
    setAiTutorLoading(true);

    try {
      const reply = await askContextualLinuxTutor({
        userQuestion: queryText,
        activity: activeActivity,
        cwd,
        vfs,
        cmdHistory
      });
      setAiTutorMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setAiTutorMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Hubo un inconveniente al consultar a Gemini. Por favor intenta nuevamente.'
        }
      ]);
    } finally {
      setAiTutorLoading(false);
    }
  };

  const handleExplainLastCommandWithAI = async () => {
    if (aiTerminalLoading) return;
    const lastEntry = cmdHistory[cmdHistory.length - 1];
    const promptForAI = lastEntry
      ? `Explica qué hizo exactamente mi último comando "${lastEntry.cmd}" (cuya salida fue: "${lastEntry.output || 'sin salida visible'}") y cómo me acerca al objetivo de esta actividad.`
      : `Aún no he ejecutado comandos en esta actividad (${activeActivity?.titulo}). ¿Me das una orientación breve para empezar sin darme la respuesta directa?`;

    setAiTerminalLoading(true);
    setTermLines((prev) => [
      ...prev,
      { type: 'system', text: '✨ Analizando tu sesión de terminal con Gemini IA...' }
    ]);

    try {
      const explanation = await askContextualLinuxTutor({
        userQuestion: promptForAI,
        activity: activeActivity,
        cwd,
        vfs,
        cmdHistory
      });
      setTermLines((prev) => [
        ...prev.filter((l) => l.text !== '✨ Analizando tu sesión de terminal con Gemini IA...'),
        { type: 'ai', text: `🤖 Análisis IA de tu terminal:\n${explanation}` }
      ]);
    } catch {
      setTermLines((prev) => [
        ...prev.filter((l) => l.text !== '✨ Analizando tu sesión de terminal con Gemini IA...'),
        { type: 'error', text: 'No fue posible obtener el análisis de IA en este instante.' }
      ]);
    } finally {
      setAiTerminalLoading(false);
    }
  };

  const handleAnalyzeCommandAI = async (e, presetQuery) => {
    if (e) e.preventDefault();
    const q = (presetQuery !== undefined ? presetQuery : aiAnatomyQuery).trim();
    if (!q || aiAnatomyLoading) return;
    if (presetQuery !== undefined) setAiAnatomyQuery(presetQuery);

    setAiAnatomyLoading(true);
    setAiAnatomyError(null);
    try {
      const data = await analyzeOrTranslateCommandAI(q);
      setAiAnatomyResult(data);
    } catch {
      setAiAnatomyError('No se pudo analizar la consulta con Gemini. Intenta de nuevo.');
    } finally {
      setAiAnatomyLoading(false);
    }
  };

  const handleGenerateExtraQuestionAI = async () => {
    if (aiGeneratingQuestion) return;
    setAiGeneratingQuestion(true);
    try {
      const totalCurrent = DIAGNOSTICO_QUESTIONS.length + extraQuizQuestions.length;
      const newQ = await generateBonusDiagnosticQuestionAI(totalCurrent);
      if (newQ && newQ.pregunta && Array.isArray(newQ.opciones)) {
        setExtraQuizQuestions((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            pregunta: newQ.pregunta,
            explicacion: newQ.explicacion,
            opciones: newQ.opciones,
            isAiGenerated: true
          }
        ]);
      }
    } catch {
      // Fail gracefully
    } finally {
      setAiGeneratingQuestion(false);
    }
  };

  const handleGenerateProgressReportAI = async () => {
    if (aiReportLoading) return;
    setAiReportLoading(true);
    try {
      const report = await generatePersonalizedProgressReportAI({
        progress,
        totalPercent,
        ruta1Percent,
        ruta2Percent,
        ruta3Percent
      });
      setAiProgressReport(report);
    } catch {
      setAiProgressReport('No se pudo generar el informe en este momento. Intenta nuevamente.');
    } finally {
      setAiReportLoading(false);
    }
  };

  const ruta1Ids = ['1.1', '1.2', '1.3', '1.4', 'reto1'];
  const ruta2Ids = ['2.1', '2.2', '2.3', '2.4', 'reto2'];
  const ruta3Ids = ['3.1', '3.2', '3.3', '3.4', 'reto3'];
  const allGradableIds = ['0.1', ...ruta1Ids, ...ruta2Ids, ...ruta3Ids];

  const ruta1Percent = Math.round(
    (ruta1Ids.filter((id) => progress.completedIds.includes(id)).length / ruta1Ids.length) * 100
  );
  const ruta2Percent = Math.round(
    (ruta2Ids.filter((id) => progress.completedIds.includes(id)).length / ruta2Ids.length) * 100
  );
  const ruta3Percent = Math.round(
    (ruta3Ids.filter((id) => progress.completedIds.includes(id)).length / ruta3Ids.length) * 100
  );
  const totalPercent = Math.round(
    (allGradableIds.filter((id) => progress.completedIds.includes(id)).length / allGradableIds.length) * 100
  );

  const goToNextActivity = () => {
    const sequence = [
      '0.1',
      '0.2',
      '1.1',
      '1.2',
      '1.3',
      '1.4',
      'reto1',
      '2.1',
      '2.2',
      '2.3',
      '2.4',
      'reto2',
      '3.1',
      '3.2',
      '3.3',
      '3.4',
      'reto3'
    ];
    const idx = sequence.indexOf(activeActivity.id);
    if (activeActivity.id === 'reto1') {
      setSummaryRouteId('ruta1');
      setScreen('P6');
      return;
    }
    if (activeActivity.id === 'reto2') {
      setSummaryRouteId('ruta2');
      setScreen('P6');
      return;
    }
    if (activeActivity.id === 'reto3') {
      setSummaryRouteId('ruta3');
      setScreen('P6');
      return;
    }
    if (idx !== -1 && idx + 1 < sequence.length) {
      openActivity(sequence[idx + 1]);
    } else {
      setScreen('P2');
    }
  };

  const getCheatsheetContent = (routeId) => {
    if (routeId === 'ruta1') {
      return [
        '# TARJETA DE REPASO (CHULETA) - RUTA 1: SUPERVIVENCIA BÁSICA EN LINUX',
        'Plataforma Educativa >_ LinuxLab',
        'Insignia obtenida: Explorador del sistema de archivos',
        '---------------------------------------------------------------------',
        '',
        '1. ¿DÓNDE ESTOY?',
        '   pwd                -> Imprime la ruta absoluta del directorio actual (/home/ana)',
        '',
        '2. MOVERSE POR EL ÁRBOL DE DIRECTORIOS',
        '   cd /home/ana/docs  -> Ir a una ruta absoluta (desde la raíz /)',
        '   cd docs            -> Ir a una ruta relativa (desde donde estás)',
        '   cd ..              -> Subir un nivel al directorio padre',
        '   cd ~               -> Volver directamente a tu carpeta personal (/home/ana)',
        '   cd -               -> Regresar al directorio anterior',
        '',
        '3. MIRAR ALREDEDOR',
        '   ls                 -> Listar archivos y carpetas visibles',
        '   ls -a              -> Mostrar también archivos ocultos (empiezan con punto .)',
        '   ls -la             -> Lista detallada con permisos, fechas, tamaños y ocultos',
        '',
        '4. LEER ARCHIVOS DE TEXTO (SOLO LECTURA SEGURA)',
        '   cat archivo.txt    -> Mostrar todo el contenido de golpe',
        '   less archivo.txt   -> Leer el contenido paginado',
        '   head archivo.txt   -> Ver las primeras 10 líneas',
        '   tail archivo.txt   -> Ver las últimas 10 líneas'
      ].join('\n');
    }
    if (routeId === 'ruta3') {
      return [
        '# TARJETA DE REPASO (CHULETA) - RUTA 3: BÚSQUEDA Y FLUJO DE DATOS EN LINUX',
        'Plataforma Educativa >_ LinuxLab',
        'Insignia obtenida: Maestro del flujo y auditoría',
        '---------------------------------------------------------------------',
        '',
        '1. BUSCAR ARCHIVOS Y CARPETAS EN EL ÁRBOL (FIND)',
        '   find . -name "*.txt"        -> Busca archivos terminados en .txt desde la carpeta actual',
        '   find /home/ana -name "*.log"-> Busca archivos .log en toda la carpeta personal',
        '   find . -type d              -> Lista únicamente directorios',
        '',
        '2. FILTRAR LÍNEAS DE TEXTO DENTRO DE ARCHIVOS (GREP)',
        '   grep "ERROR" servidor.log   -> Muestra solo las líneas que contienen "ERROR"',
        '   grep -i "error" servidor.log-> Ignora diferencias entre mayúsculas y minúsculas',
        '   grep -n "INTRUSO" auth.log  -> Muestra el número exacto de línea de cada coincidencia',
        '',
        '3. CONECTAR COMANDOS CON TUBERÍAS (PIPE |)',
        '   ls -la | grep ".txt"        -> Filtra el listado de archivos mostrando solo los .txt',
        '   cat servidor.log | grep "WARN" -> Pasa el texto del archivo al filtro grep',
        '',
        '4. REDIRECCIÓN DE SALIDA HACIA ARCHIVOS (> y >>)',
        '   grep "ERROR" app.log > errores.txt  -> Crea o sobrescribe errores.txt con el resultado',
        '   echo "Fin de revisión" >> errores.txt -> Añade una línea al final sin borrar lo anterior'
      ].join('\n');
    }
    return [
      '# TARJETA DE REPASO (CHULETA) - RUTA 2: MANIPULACIÓN SEGURA EN LINUX',
      'Plataforma Educativa >_ LinuxLab',
      'Insignia obtenida: Guardián de la manipulación segura',
      '---------------------------------------------------------------------',
      '',
      '1. CREAR ESTRUCTURAS',
      '   mkdir carpeta          -> Crea un directorio nuevo',
      '   mkdir -p web/css       -> Crea directorios anidados de una sola vez',
      '   touch index.html       -> Crea un archivo vacío',
      '',
      '2. COPIAR, MOVER Y RENOMBRAR',
      '   cp notas.txt docs/     -> Copia un archivo dentro de otra carpeta',
      '   cp -r carpeta backup/  -> Copia un directorio completo recursivamente',
      '   mv foto.jpg fotos/     -> Mueve un archivo a otra carpeta',
      '   mv borrador.txt ok.txt -> Renombra un archivo en el mismo lugar',
      '',
      '3. BORRAR CON CUIDADO (SIN PAPELERA)',
      '   rm -i basura.tmp       -> Pide confirmación antes de eliminar',
      '   rmdir carpeta_vacia    -> Solo borra la carpeta si está 100% vacía',
      '   ¡NUNCA EJECUTAR! rm -rf / o rm -rf * sin verificar antes',
      '',
      '4. COMODINES (WILDCARDS) Y HÁBITO DE VISTA PREVIA',
      '   ls *.jpg               -> Vista previa segura de qué archivos coinciden',
      '   mv *.jpg fotos/        -> Mueve todos los archivos terminados en .jpg'
    ].join('\n');
  };

  const downloadCheatsheet = (routeId) => {
    const content = getCheatsheetContent(routeId);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chuleta-linuxlab-${routeId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderNavbar = () => (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setScreen('P0')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-base group-hover:bg-indigo-600/30 transition-colors">
              &gt;_
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg">LinuxLab</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                RED · PMV
              </span>
            </div>
          </button>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setScreen('P2')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                screen === 'P2' || screen === 'P3_P4' || screen === 'P5'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Rutas</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('P8')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                screen === 'P8'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Glosario (man)</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('P7')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                screen === 'P7' || screen === 'P6'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Mi progreso</span>
              <span className="ml-1 px-1.5 py-0.2 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                {totalPercent}%
              </span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAiLabModal(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Asistente IA Gemini</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setProgress((p) => ({ ...p, reviewerMode: !p.reviewerMode }))
            }
            title="Activa o desactiva el desbloqueo libre de todas las lecciones y retos para evaluación docente"
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
              progress.reviewerMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {progress.reviewerMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">Modo docente:</span>
            <span className="font-semibold">{progress.reviewerMode ? 'Desbloqueado' : 'Secuencial'}</span>
          </button>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reiniciar progreso de prueba</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-700/60 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-rose-200">¿Borrar progreso?</span>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setProgress(defaultProgress);
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                  setShowResetConfirm(false);
                  setScreen('P0');
                }}
                className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  const renderP0 = () => (
    <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14 space-y-12">
      <div className="grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Entorno de práctica 100 % aislado y con Modo Seguro anti-ansiedad</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            «La terminal <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">no muerde</span>»
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Pierde el miedo a la pantalla negra de Linux practicando paso a paso en un laboratorio virtual interactivo. Aquí no puedes romper tu computador: explora carpetas, manipula archivos y aprende con analogías visuales e indicaciones en tiempo real.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => openActivity('0.1')}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Empezar desde cero</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScreen('P1');
              }}
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Ya sé algo: diagnóstico</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('P2')}
              className="px-4 py-3.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium flex items-center gap-1.5 transition-all"
            >
              <span>Ver mapa de rutas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <WelcomeAnimatedTerminal />
        </div>
      </div>

      {/* Tarjetas inferiores de vista previa de las 3 rutas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Rutas de aprendizaje progresivo</span>
          </h2>
          <span className="text-xs text-slate-400">Tu avance se guarda automáticamente</span>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Ruta 1 */}
          <div
            onClick={() => setScreen('P2')}
            className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Ruta 1 · Disponible
              </span>
              <span className="text-xs font-mono text-slate-400">{ruta1Percent}%</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                Supervivencia básica
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Orientación, desplazamiento y lectura segura de archivos: <code className="text-emerald-300">pwd</code>, <code className="text-emerald-300">cd</code>, <code className="text-emerald-300">ls -la</code>, <code className="text-emerald-300">cat</code>.
              </p>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${ruta1Percent}%` }}
              />
            </div>
          </div>

          {/* Ruta 2 */}
          <div
            onClick={() => setScreen('P2')}
            className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Ruta 2 · {progress.unlockedRuta2 || progress.reviewerMode || progress.completedIds.includes('reto1') ? 'Desbloqueada' : 'Secuencial'}
              </span>
              <span className="text-xs font-mono text-slate-400">{ruta2Percent}%</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                Manipulación segura
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Crear, copiar, mover, comodines y borrado con Modo Seguro: <code className="text-indigo-300">mkdir</code>, <code className="text-indigo-300">touch</code>, <code className="text-indigo-300">cp</code>, <code className="text-indigo-300">mv</code>, <code className="text-indigo-300">rm -i</code>, <code className="text-indigo-300">*</code>.
              </p>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${ruta2Percent}%` }}
              />
            </div>
          </div>

          {/* Ruta 3 */}
          <div
            onClick={() => setScreen('P2')}
            className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Ruta 3 · {progress.unlockedRuta3 || progress.reviewerMode || progress.completedIds.includes('reto2') ? 'Desbloqueada' : 'Secuencial'}
              </span>
              <span className="text-xs font-mono text-slate-400">{ruta3Percent}%</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                Búsqueda y flujo de datos
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Búsqueda avanzada, filtrado de texto, tuberías y redirecciones: <code className="text-amber-300">find</code>, <code className="text-amber-300">grep</code>, <code className="text-amber-300">|</code>, <code className="text-amber-300">&gt;</code>, <code className="text-amber-300">&gt;&gt;</code>.
              </p>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${ruta3Percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderP1 = () => {
    const allQuestions = [...DIAGNOSTICO_QUESTIONS, ...extraQuizQuestions];
    const score = allQuestions.reduce((acc, q) => {
      const selected = quizAnswers[q.id];
      const correctOpt = q.opciones.find((o) => o.correcta);
      return acc + (countrySafeMatch(selected, correctOpt) ? 1 : 0);
    }, 0);

    function countrySafeMatch(selected, correctOpt) {
      return Boolean(correctOpt && selected === correctOpt.id);
    }

    const allAnswered = allQuestions.every((q) => Boolean(quizAnswers[q.id]));

    const handleFinishQuiz = () => {
      const unlockR2 = score >= 4;
      setQuizSubmitted(true);
      setProgress((prev) => ({
        ...prev,
        diagnosticoCompletado: true,
        diagnosticoPuntaje: score,
        completedIds: prev.completedIds.includes('0.2') ? prev.completedIds : [...prev.completedIds, '0.2'],
        unlockedRuta2: prev.unlockedRuta2 || unlockR2
      }));
    };

    const handleSkipQuiz = () => {
      setProgress((prev) => ({
        ...prev,
        diagnosticoOmitido: true,
        completedIds: prev.completedIds.includes('0.2') ? prev.completedIds : [...prev.completedIds, '0.2']
      }));
      openActivity('1.1');
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                P1 · Lección 0.2 · Diagnóstico Inicial + IA
              </span>
              <h1 className="text-2xl font-bold text-white mt-2">
                Descubre tu punto de partida ideal
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Responde estas preguntas rápidas. Si obtienes 4 o más aciertos, desbloquearemos directamente la **Ruta 2: Manipulación segura** para ti. También puedes generar preguntas extra con Gemini IA.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={aiGeneratingQuestion}
                onClick={handleGenerateExtraQuestionAI}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold border border-indigo-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {aiGeneratingQuestion ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{aiGeneratingQuestion ? 'Generando con IA...' : '✨ Añadir pregunta con IA'}</span>
              </button>
              <button
                type="button"
                onClick={handleSkipQuiz}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
              >
                Omitir diagnóstico e ir a Ruta 1 →
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {allQuestions.map((q, index) => {
            const userSelected = quizAnswers[q.id];
            return (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-white">
                    <span className="text-indigo-400 font-mono mr-2">
                      {index + 1}/{allQuestions.length}.
                    </span>
                    {q.pregunta}
                  </h3>
                  {q.isAiGenerated && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                      ✨ Generada por Gemini
                    </span>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {q.opciones.map((opt) => {
                    const isSelected = userSelected === opt.id;
                    let cardStyle = 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600';
                    if (!quizSubmitted && isSelected) {
                      cardStyle = 'bg-indigo-600/20 border-indigo-500 text-white';
                    } else if (quizSubmitted) {
                      if (opt.correcta) {
                        cardStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200';
                      } else if (isSelected && !opt.correcta) {
                        cardStyle = 'bg-rose-500/15 border-rose-500/60 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={quizSubmitted}
                        onClick={() =>
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`p-3 rounded-xl border text-left font-mono text-xs flex items-center justify-between transition-all ${cardStyle}`}
                      >
                        <span>
                          <strong className="uppercase mr-2">{opt.id})</strong>
                          {opt.texto}
                        </span>
                        {quizSubmitted && opt.correcta && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{q.explicacion}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!quizSubmitted ? (
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-xs text-slate-400">
              Preguntas respondidas: {Object.keys(quizAnswers).length} de {allQuestions.length}
            </span>
            <button
              type="button"
              disabled={!allAnswered}
              onClick={handleFinishQuiz}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                allAnswered
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Calificar diagnóstico
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400">
                  Resultado del Diagnóstico
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  Obtuviste {score} de {allQuestions.length} aciertos
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  {score >= 4
                    ? '¡Excelente base conceptual! Hemos desbloqueado directamente la Ruta 2 (Manipulación segura), aunque puedes repasar la Ruta 1 cuando quieras.'
                    : 'Te recomendamos comenzar por la Ruta 1 (Supervivencia básica) para dominar las bases paso a paso sin estrés.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openActivity('1.1')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700"
                >
                  Ir a Lección 1.1 (Ruta 1)
                </button>
                {score >= 4 && (
                  <button
                    type="button"
                    onClick={() => openActivity('2.1')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30"
                  >
                    Empezar en Ruta 2 (Lección 2.1) →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderP2 = () => {
    const introItems = CURRICULUM.filter((c) => c.rutaId === 'intro');
    const ruta1Items = CURRICULUM.filter((c) => c.rutaId === 'ruta1');
    const ruta2Items = CURRICULUM.filter((c) => c.rutaId === 'ruta2');
    const ruta3Items = CURRICULUM.filter((c) => c.rutaId === 'ruta3');

    const renderCard = (item) => {
      const completed = progress.completedIds.includes(item.id);
      const unlocked = isActivityUnlocked(item.id);
      const isReto = item.tipo === 'reto';

      return (
        <button
          key={item.id}
          type="button"
          disabled={!unlocked}
          onClick={() => openActivity(item.id)}
          className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
            completed
              ? 'bg-emerald-950/25 border-emerald-500/40 hover:border-emerald-400'
              : unlocked
              ? 'bg-slate-900 border-indigo-500/50 hover:border-indigo-400 shadow-md shadow-indigo-950/30'
              : 'bg-slate-900/40 border-slate-800/80 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between gap-2 w-full">
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                isReto
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {item.codigo}
            </span>
            {completed ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> ✓
              </span>
            ) : unlocked ? (
              <span className="text-[11px] text-indigo-400 font-medium">Disponible</span>
            ) : (
              <Lock className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{item.titulo}</h4>
            {item.comandosAprendidos && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.comandosAprendidos.map((c) => (
                  <code
                    key={c}
                    className="text-[11px] px-1.5 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800"
                  >
                    {c}
                  </code>
                ))}
              </div>
            )}
          </div>
        </button>
      );
    };

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Mapa de Rutas de Aprendizaje</h1>
            <p className="text-sm text-slate-400 mt-1">
              Avanza paso a paso para desbloquear nuevas estaciones o activa el interruptor «Modo docente» en la barra superior para explorar libremente.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Avance global</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{totalPercent}%</span>
            </div>
          </div>
        </div>

        {/* Sección 0: Introducción */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Módulo 0 · Introducción y Diagnóstico</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {introItems.map(renderCard)}
          </div>
        </section>

        {/* Fila 1: Ruta 1 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Ruta 1 · Supervivencia básica (`pwd`, `cd`, `ls`, `cat`, `less`, `head`, `tail`)</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400">{ruta1Percent}% completado</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ruta1Items.map(renderCard)}
          </div>
        </section>

        {/* Fila 2: Ruta 2 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Ruta 2 · Manipulación segura (`mkdir`, `touch`, `cp`, `mv`, `rm`, `rmdir`, `*`)</span>
            </h2>
            <span className="text-xs font-mono text-indigo-400">{ruta2Percent}% completado</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ruta2Items.map(renderCard)}
          </div>
        </section>

        {/* Fila 3: Ruta 3 (Completa e Interactiva) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              <span>Ruta 3 · Búsqueda y flujo de datos (`find`, `grep`, `|`, `&gt;`, `&gt;&gt;`)</span>
            </h2>
            <span className="text-xs font-mono text-amber-400">{ruta3Percent}% completado</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ruta3Items.map(renderCard)}
          </div>
        </section>
      </div>
    );
  };

  const renderTerminalAndTree = (isChallenge = false) => {
    const promptDisplay = cwd.startsWith('/home/ana')
      ? `~${cwd.slice('/home/ana'.length)}`
      : cwd;

    return (
      <div className="space-y-4 flex flex-col">
        {/* Terminal Emulator Card */}
        <div
          onClick={() => inputRef.current && inputRef.current.focus()}
          className="rounded-2xl overflow-hidden border border-slate-700/90 shadow-2xl bg-[#121417] flex flex-col"
        >
          {/* Top Terminal Bar */}
          <div className="bg-slate-800/95 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-slate-300">
                ana@lab:{promptDisplay}$
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                🛡 Modo Seguro
              </span>
              <button
                type="button"
                disabled={aiTerminalLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleExplainLastCommandWithAI();
                }}
                title="Pide a Gemini IA que analice tu último comando o te oriente según tu carpeta actual"
                className="text-xs px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {aiTerminalLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Explicar con IA</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  initActivityEnvironment(activeActivity);
                }}
                className="text-xs px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar entorno</span>
              </button>
            </div>
          </div>

          {/* Terminal Output Scroll Area */}
          <div className="p-4 font-mono text-sm space-y-2 h-[290px] lg:h-[320px] overflow-y-auto text-slate-200">
            {termLines.map((line, i) => {
              if (line.type === 'system') {
                return (
                  <div key={i} className="text-xs text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
                    {line.text}
                  </div>
                );
              }
              if (line.type === 'input') {
                return (
                  <div key={i} className="break-all">
                    <span className="text-emerald-400 font-semibold">ana@lab</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-sky-400 font-semibold">{line.prompt}</span>
                    <span className="text-slate-300">$ </span>
                    <span className="text-white">{line.text}</span>
                  </div>
                );
              }
              if (line.type === 'error') {
                return (
                  <pre key={i} className="text-rose-400 whitespace-pre-wrap text-xs leading-relaxed">
                    {line.text}
                  </pre>
                );
              }
              if (line.type === 'warning') {
                return (
                  <pre
                    key={i}
                    className="text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 whitespace-pre-wrap text-xs leading-relaxed"
                  >
                    {line.text}
                  </pre>
                );
              }
              if (line.type === 'ai') {
                return (
                  <div
                    key={i}
                    className="text-indigo-200 bg-indigo-950/50 border border-indigo-500/40 rounded-xl p-3 whitespace-pre-wrap text-xs leading-relaxed font-sans"
                  >
                    {line.text}
                  </div>
                );
              }
              if (line.type === 'success') {
                return (
                  <pre key={i} className="text-emerald-300 whitespace-pre-wrap text-xs leading-relaxed">
                    {line.text}
                  </pre>
                );
              }
              return (
                <pre key={i} className="text-slate-200 whitespace-pre-wrap text-xs leading-relaxed">
                  {line.text}
                </pre>
              );
            })}

            {/* Active Command Prompt Line */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-1 pt-1">
              <span className="shrink-0">
                {pendingRm ? (
                  <span className="text-amber-400 font-bold">[Confirmar s/N] &gt; </span>
                ) : (
                  <>
                    <span className="text-emerald-400 font-semibold">ana@lab</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-sky-400 font-semibold">{promptDisplay}</span>
                    <span className="text-slate-300">$ </span>
                  </>
                )}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                placeholder={pendingRm ? 'Escribe s para confirmar o n para cancelar...' : 'Escribe un comando y presiona Enter...'}
                className="flex-1 bg-transparent text-white focus:outline-none font-mono text-sm caret-emerald-400"
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
              <span className="w-2 h-4 bg-emerald-400 animate-pulse shrink-0" />
            </form>
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Footer Helper */}
          <div className="bg-slate-900/90 px-4 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
            <span>↑↓ Historial · Tab Autocompletar · Enter Ejecutar</span>
            <span>💡 Tip IA: Escribe `ai &lt;tu duda&gt;` en consola o `help`</span>
          </div>
        </div>

        {/* Collapsible Directory Tree Accordion / Panel */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenTreeAcc((o) => !o)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">
                {isChallenge
                  ? 'Vista comparativa del Sistema de Archivos (Estado actual vs. Metas)'
                  : 'Mapa visual del árbol de directorios'}
              </span>
            </div>
            {openTreeAcc ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openTreeAcc && (
            <div className="p-4 pt-0 space-y-3">
              <DirectoryTreePanel
                vfs={vfs}
                cwd={cwd}
                showHiddenFiles={showHiddenTree}
                onToggleHidden={() => setShowHiddenTree((h) => !h)}
              />
              {isChallenge && activeActivity.metasVisuales && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 block">
                    Estado Meta Esperado al Completar el Reto:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {activeActivity.metasVisuales.map((m, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderP3P4 = () => {
    const isCompleted = progress.completedIds.includes(activeActivity.id);

    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <button
              type="button"
              onClick={() => setScreen('P2')}
              className="hover:text-white text-indigo-400 font-medium"
            >
              {activeActivity.rutaTitulo}
            </button>
            <ChevronRight className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-white">
              {activeActivity.codigo}: {activeActivity.titulo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Objetivo superado
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
                Paso práctico guiado
              </span>
            )}
          </div>
        </div>

        {/* Desktop Split Layout / Mobile Accordion Layout */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Lesson Content, Analogy, Objective, 3-level Scaffolding */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenTheoryAcc((o) => !o)}
              className="w-full px-5 py-4 flex items-center justify-between bg-slate-900 border-b border-slate-800 lg:cursor-default"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <h2 className="font-bold text-white text-base">Guía Pedagógica y Objetivo</h2>
              </div>
              <span className="lg:hidden text-xs text-slate-400 flex items-center gap-1">
                {openTheoryAcc ? 'Plegar' : 'Desplegar'}
                {openTheoryAcc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            <div className={`${openTheoryAcc ? 'block' : 'hidden lg:block'} p-5 space-y-5`}>
              {/* Max 3 concise paragraphs */}
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                {activeActivity.parrafos.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* GUI Analogy Box */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
                <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Analogía con la interfaz gráfica (GUI):</span>
                </div>
                <p className="leading-relaxed">{activeActivity.analogia}</p>
              </div>

              {/* Clickable Example Command */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-400">
                  Ejemplo interactivo (haz clic para enviarlo a la terminal):
                </span>
                <button
                  type="button"
                  onClick={() => insertExampleCommand(activeActivity.ejemploCmd)}
                  className="w-full p-3 rounded-xl bg-[#121417] hover:bg-slate-950 border border-slate-700 hover:border-emerald-500/50 flex items-center justify-between font-mono text-xs text-emerald-300 transition-all group cursor-pointer"
                >
                  <span>$ {activeActivity.ejemploCmd}</span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-emerald-300">
                    {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCmd ? '¡Escrito en consola!' : 'Escribir en terminal'}
                  </span>
                </button>
              </div>

              {/* Highlighted Step Objective */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Objetivo del paso</span>
                </div>
                <p className="text-sm text-white font-medium leading-relaxed">
                  {activeActivity.objetivoTexto}
                </p>
              </div>

              {/* 3-Level Scaffolding Hints */}
              <div className="space-y-3 pt-1 border-t border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-400">
                    Andamiaje de ayuda progresiva (sin penalización):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHintLevel((l) => Math.min(2, l + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>
                        {hintLevel === 0
                          ? 'Pedir Pista (Nivel 1)'
                          : hintLevel === 1
                          ? 'Pista 2 (Estructura)'
                          : 'Pistas mostradas'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHintLevel(3)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver solución</span>
                    </button>
                  </div>
                </div>

                {hintLevel >= 1 && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-amber-400">Pista 1 (Conceptual): </strong>
                    {activeActivity.pistas[0]}
                  </div>
                )}
                {hintLevel >= 2 && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-amber-400">Pista 2 (Estructura): </strong>
                    {activeActivity.pistas[1]}
                  </div>
                )}
                {hintLevel >= 3 && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs flex items-center justify-between gap-2">
                    <div>
                      <strong className="text-emerald-400">Solución exacta: </strong>
                      <code className="font-mono text-white">{activeActivity.pistas[2]}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => insertExampleCommand(activeActivity.pistas[2])}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] shrink-0 cursor-pointer"
                    >
                      Probar comando
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Simulated Terminal + Collapsible Directory Tree */}
          <div className="lg:col-span-7">
            {renderTerminalAndTree(false)}
          </div>
        </div>

        {/* Bottom Immediate Validation Bar */}
        <div
          className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-4 transition-all ${
            isCompleted
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <Terminal className="w-5 h-5 text-indigo-400 shrink-0" />
            )}
            <span className="text-sm font-medium">
              {feedbackBanner ? feedbackBanner.text : 'Ejecuta el comando en la terminal para validar el objetivo.'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowAiLabModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-emerald-400" />
              <span>Consultar Tutor IA</span>
            </button>

            <button
              type="button"
              disabled={!isCompleted && !progress.reviewerMode}
              onClick={goToNextActivity}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                isCompleted || progress.reviewerMode
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Siguiente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderP5 = () => {
    const checklistResults = (activeActivity.checklist || []).map((item) => ({
      ...item,
      done: item.check({ vfs, cwd, history: cmdHistory })
    }));
    const allCompleted = checklistResults.every((c) => c.done);

    const handleValidateChallenge = () => {
      if (allCompleted || progress.reviewerMode) {
        markActivityCompleted(activeActivity);
        setSummaryRouteId(activeActivity.rutaId);
        setScreen('P6');
      } else {
        const missing = checklistResults.find((c) => !c.done);
        setFeedbackBanner({
          type: 'pending',
          text: `Aún falta completar: "${missing.texto}". ¡Revisa la lista de objetivos o pide una pista gratuita!`
        });
      }
    };

    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Challenge Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-amber-500/40 rounded-2xl px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                {activeActivity.codigo} · Reto Integrador
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                ⏱ Tiempo libre, sin penalización
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
              {activeActivity.titulo}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setScreen('P2')}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700"
          >
            ← Volver al mapa
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Scenario + Live Automatic Checklist + Hints */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
                Escenario del Laboratorio
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {activeActivity.escenario}
              </p>
            </div>

            {/* Live Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Lista de verificación de objetivos
                </h3>
                <span className="text-xs font-mono text-emerald-400">
                  {checklistResults.filter((c) => c.done).length}/{checklistResults.length} cumplidos
                </span>
              </div>
              <div className="space-y-2">
                {checklistResults.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                      item.done
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <span className={item.done ? 'line-through decoration-emerald-500/50 font-medium' : ''}>
                      {item.texto}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hints Box for Challenge */}
            {hintLevel > 0 && activeActivity.pistasReto && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {activeActivity.pistasReto.slice(0, hintLevel).map((pista, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200"
                  >
                    <strong>Pista {i + 1}: </strong>
                    {pista}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => initActivityEnvironment(activeActivity)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar entorno</span>
              </button>

              <button
                type="button"
                onClick={() => setHintLevel((l) => Math.min(3, l + 1))}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Pedir pista (-0 puntos)</span>
              </button>

              <button
                type="button"
                onClick={handleValidateChallenge}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  allCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Validar reto</span>
              </button>
            </div>

            {feedbackBanner && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  allCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                {feedbackBanner.text}
              </div>
            )}
          </div>

          {/* Right Panel: Terminal + Comparative Visual File System */}
          <div className="lg:col-span-7">
            {renderTerminalAndTree(true)}
          </div>
        </div>
      </div>
    );
  };

  const renderP6 = () => {
    const isRuta1 = summaryRouteId === 'ruta1';
    const isRuta2 = summaryRouteId === 'ruta2';
    const badgeTitle = isRuta1
      ? 'Explorador del sistema de archivos'
      : isRuta2
      ? 'Guardián de la manipulación segura'
      : 'Maestro del flujo y auditoría';
    const routeTitle = isRuta1
      ? 'Ruta 1: Supervivencia básica'
      : isRuta2
      ? 'Ruta 2: Manipulación segura'
      : 'Ruta 3: Búsqueda y flujo de datos';
    const commandsList = isRuta1
      ? ['pwd', 'cd', 'ls', 'ls -a', 'ls -la', 'cat', 'less', 'head', 'tail']
      : isRuta2
      ? ['mkdir', 'mkdir -p', 'touch', 'cp', 'cp -r', 'mv', 'rm -i', 'rmdir', '*.jpg']
      : ['find', 'find -name', 'grep', 'grep -i', 'grep -n', '| (pipe)', '> (sobrescribir)', '>> (añadir)'];

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-indigo-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Award className="w-11 h-11 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              ¡Ruta Completada con Éxito!
            </span>
            <h1 className="text-3xl font-extrabold text-white pt-1">{routeTitle}</h1>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Has desbloqueado la insignia oficial <strong className="text-emerald-300">«{badgeTitle}»</strong> tras demostrar dominio práctico en la terminal sin temor a equivocarte.
            </p>
          </div>

          {/* Mastered Commands */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Comandos y opciones dominados en esta ruta
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {commandsList.map((c) => (
                <code
                  key={c}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-emerald-300 border border-slate-700 font-mono text-xs"
                >
                  {c}
                </code>
              ))}
            </div>
          </div>

          {/* Downloadable / Printable Review Card Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadCheatsheet(summaryRouteId)}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Tarjeta de Repaso (.md)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCheatsheetModal(true)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-400" />
              <span>Ver / Imprimir Chuleta</span>
            </button>

            {isRuta1 ? (
              <button
                type="button"
                onClick={() => openActivity('2.1')}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Continuar a Ruta 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : isRuta2 ? (
              <button
                type="button"
                onClick={() => openActivity('3.1')}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Continuar a Ruta 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setScreen('P7')}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>Ver Mi Progreso Final</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderP7 = () => {
    const badgesCatalog = [
      {
        id: 'explorador',
        nombre: 'Explorador del sistema de archivos',
        ruta: 'Ruta 1 · Supervivencia básica',
        desc: 'Otorgada por orientarse en el árbol de directorios, revelar archivos ocultos y superar la búsqueda del tesoro.'
      },
      {
        id: 'guardian',
        nombre: 'Guardián de la manipulación segura',
        ruta: 'Ruta 2 · Manipulación segura',
        desc: 'Otorgada por organizar directorios caóticos usando comodines y borrado responsable con confirmación.'
      },
      {
        id: 'maestro_flujo',
        nombre: 'Maestro del flujo y auditoría',
        ruta: 'Ruta 3 · Búsqueda y flujo de datos',
        desc: 'Otorgada por auditar registros del servidor combinando búsquedas recursivas, filtros de texto, tuberías y redirecciones.'
      }
    ];

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Progreso en LinuxLab</h1>
            <p className="text-sm text-slate-400 mt-1">
              Seguimiento detallado de tus lecciones superadas, rutas completadas, insignias y comandos aprendidos.
            </p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="text-xs text-slate-400 block">Porcentaje Total Completado</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{totalPercent}%</span>
          </div>
        </div>

        {/* Visual Progress Bars per Route */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Avance por Ruta de Aprendizaje</span>
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-200">Introducción (Lección 0.1 y Diagnóstico)</span>
                  <span className="font-mono text-emerald-400">
                    {progress.completedIds.includes('0.1') ? '100%' : '0%'}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500"
                    style={{ width: progress.completedIds.includes('0.1') ? '100%' : '0%' }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-200">Ruta 1: Supervivencia básica (4 lecciones + Reto 1)</span>
                  <span className="font-mono text-emerald-400">{ruta1Percent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${ruta1Percent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-200">Ruta 2: Manipulación segura (4 lecciones + Reto 2)</span>
                  <span className="font-mono text-indigo-400">{ruta2Percent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${ruta2Percent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-200">Ruta 3: Búsqueda y flujo de datos (4 lecciones + Reto 3)</span>
                  <span className="font-mono text-amber-400">{ruta3Percent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${ruta3Percent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Diagnóstico inicial:{' '}
                {progress.diagnosticoCompletado
                  ? `${progress.diagnosticoPuntaje}/5 aciertos`
                  : progress.diagnosticoOmitido
                  ? 'Omitido'
                  : 'Pendiente'}
              </span>
              <button
                type="button"
                onClick={() => setScreen('P1')}
                className="text-indigo-400 hover:underline"
              >
                Repetir diagnóstico
              </button>
            </div>
          </div>

          {/* Earned Badges */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Insignias y Tarjetas de Repaso</span>
            </h2>
            <div className="space-y-3">
              {badgesCatalog.map((b) => {
                const earned = progress.badges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                      earned
                        ? 'bg-emerald-950/25 border-emerald-500/40'
                        : 'bg-slate-950/50 border-slate-800 opacity-65'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-indigo-400">{b.ruta}</span>
                        {earned ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                            Desbloqueada
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Pendiente
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white">{b.nombre}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{b.desc}</p>
                    </div>
                    {earned && (
                      <button
                        type="button"
                        onClick={() =>
                          downloadCheatsheet(
                            b.id === 'explorador' ? 'ruta1' : b.id === 'guardian' ? 'ruta2' : 'ruta3'
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-slate-700 shrink-0 flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Chuleta</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI Personalized Progress Coach Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-emerald-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Entrenador IA Gemini: Diagnóstico de Progreso y Plan Personalizado</span>
                </h2>
                <p className="text-xs text-slate-300">
                  Genera un análisis inteligente de tus fortalezas actuales y recibe un mini-reto adaptado a los comandos que ya dominas.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={aiReportLoading}
              onClick={handleGenerateProgressReportAI}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              {aiReportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-300" />
              )}
              <span>{aiReportLoading ? 'Analizando tu progreso...' : '✨ Generar Informe con IA'}</span>
            </button>
          </div>

          {aiProgressReport && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {aiProgressReport}
            </div>
          )}
        </div>

        {/* Learned Commands Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <span>Comandos practicados y aprendidos ({progress.learnedCommands.length})</span>
            </h2>
            <button
              type="button"
              onClick={() => setScreen('P8')}
              className="text-xs text-indigo-400 hover:underline"
            >
              Consultar Glosario completo (man) →
            </button>
          </div>
          {progress.learnedCommands.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aún no has completado tu primera lección práctica. ¡Ve a la Lección 0.1 para aprender tu primer comando!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {progress.learnedCommands.map((cmd) => (
                <span
                  key={cmd}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {cmd}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderP8 = () => {
    const categories = ['Todas', 'Intro / Salida', 'Ruta 1 · Supervivencia', 'Ruta 2 · Manipulación', 'Ruta 3 · Búsqueda y flujo'];

    const filteredGlossary = GLOSARIO_DATA.filter((item) => {
      const matchesCat = glossaryCategory === 'Todas' || item.categoria === glossaryCategory;
      const q = glossaryQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.cmd.toLowerCase().includes(q) ||
        item.descripcion.toLowerCase().includes(q) ||
        item.analogia.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });

    const getRiskBadge = (riesgo) => {
      if (riesgo.includes('Alto')) {
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      }
      if (riesgo.includes('Precaución')) {
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      }
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    };

    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* AI Natural Language to Bash & Command Anatomy Analyzer */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/35 to-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ✨ Gemini Structured Output · NL2Bash
              </span>
              <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-400" />
                <span>Traductor y Desglosador Anatómico de Comandos con IA</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Escribe en español lo que deseas hacer (ej. <em>«buscar todos los archivos .txt dentro de proyectos»</em>) o pega un comando complejo para que Gemini desglose su anatomía pieza por pieza.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => handleAnalyzeCommandAI(e)} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={aiAnatomyQuery}
              onChange={(e) => setAiAnatomyQuery(e.target.value)}
              placeholder="Ej: ¿Cómo copio una carpeta entera de forma recursiva? o find /home/ana -name '*.jpg'"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={aiAnatomyLoading || !aiAnatomyQuery.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {aiAnatomyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-300" />
              )}
              <span>{aiAnatomyLoading ? 'Analizando con Gemini...' : 'Traducir / Desglosar con IA'}</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-slate-400 py-1">Ejemplos rápidos:</span>
            {[
              'Listar todos los archivos ocultos con detalles de tamaño y fecha',
              'find /home/ana -name "*.txt" | grep "pista"',
              'Borrar todos los archivos temporales .tmp pidiendo confirmación'
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleAnalyzeCommandAI(null, sample)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-700 transition-colors cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>

          {aiAnatomyError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200">
              {aiAnatomyError}
            </div>
          )}

          {aiAnatomyResult && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <code className="text-base sm:text-lg font-bold font-mono px-3.5 py-1.5 rounded-xl bg-[#121417] text-emerald-400 border border-emerald-500/40">
                    $ {aiAnatomyResult.comandoSugerido}
                  </code>
                  <span
                    className={`text-xs font-mono px-2.5 py-1 rounded-full border ${getRiskBadge(
                      aiAnatomyResult.nivelRiesgo || 'Seguro'
                    )}`}
                  >
                    Riesgo: {aiAnatomyResult.nivelRiesgo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    insertExampleCommand(aiAnatomyResult.comandoSugerido);
                    setScreen('P3_P4');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Probar en Terminal</span>
                </button>
              </div>

              <p className="text-sm text-slate-200 leading-relaxed">{aiAnatomyResult.proposito}</p>

              {/* Token-by-token visual breakdown */}
              {Array.isArray(aiAnatomyResult.anatomia) && aiAnatomyResult.anatomia.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block">
                    Anatomía del comando pieza por pieza:
                  </span>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {aiAnatomyResult.anatomia.map((part, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <code className="font-mono text-xs font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {part.fragmento}
                          </code>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                            {part.tipo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{part.explicacion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200">
                  <strong className="text-indigo-300 block mb-0.5">🖥 Analogía con Interfaz Gráfica:</strong>
                  {aiAnatomyResult.analogiaGrafica}
                </div>
                <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 text-xs text-amber-200">
                  <strong className="text-amber-300 block mb-0.5">🛡 Consejo de Seguridad:</strong>
                  {aiAnatomyResult.consejoSeguridad}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                <span>Glosario Interactivo de Comandos (`man`)</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Consulta rápida de sintaxis, opciones principales, nivel de riesgo y ejemplos de los 18 comandos y operadores del curso.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                placeholder="Buscar comando por nombre o descripción (ej. ls, borrar, oculto, grep)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGlossaryCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    glossaryCategory === cat
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filteredGlossary.map((item) => (
            <div
              key={item.cmd}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <code className="text-lg font-bold font-mono px-3 py-1 rounded-lg bg-[#121417] text-emerald-400 border border-slate-800">
                      {item.cmd}
                    </code>
                    <span className="text-xs text-slate-400">{item.categoria}</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${getRiskBadge(
                      item.riesgo
                    )}`}
                  >
                    Riesgo: {item.riesgo}
                  </span>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed">{item.descripcion}</p>

                <div className="text-xs text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                  <strong className="text-indigo-300">Analogía gráfica: </strong>
                  {item.analogia}
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold">Sintaxis: </span>
                    <code className="font-mono text-sky-300">{item.sintaxis}</code>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Opciones clave: </span>
                    <span className="text-slate-300">{item.opciones.join(' · ')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Ejemplo práctico:</span>
                <code className="px-2.5 py-1 rounded bg-[#121417] text-emerald-300 border border-slate-800">
                  $ {item.ejemplo}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {renderNavbar()}

      <main className="flex-1">
        {screen === 'P0' && renderP0()}
        {screen === 'P1' && renderP1()}
        {screen === 'P2' && renderP2()}
        {screen === 'P3_P4' && renderP3P4()}
        {screen === 'P5' && renderP5()}
        {screen === 'P6' && renderP6()}
        {screen === 'P7' && renderP7()}
        {screen === 'P8' && renderP8()}
      </main>

      {/* Modal Informativo Ruta 3 */}
      {showRuta3Modal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Vista previa · Próxima versión
              </span>
              <button
                type="button"
                onClick={() => setShowRuta3Modal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-bold text-white">
              Ruta 3: Búsqueda y flujo de datos (`find`, `grep`, `|`, `&gt;`)
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              En este Producto Mínimo Viable (PMV) se encuentran 100 % operativas y evaluables la **Introducción**, la **Ruta 1 (Supervivencia básica)** y la **Ruta 2 (Manipulación segura)** junto con sus 2 Retos integradores.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-amber-300">Contenidos planificados para la Ruta 3 (v2.0):</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Lección 3.1 (`find`):</strong> Localización de archivos por nombre y extensión.</li>
                <li><strong>Lección 3.2 (`grep`):</strong> Filtrado de patrones de texto dentro de logs.</li>
                <li><strong>Lección 3.3 (`|`):</strong> Encadenamiento de salidas con tuberías (pipes).</li>
                <li><strong>Lección 3.4 (`&gt;` y `&gt;&gt;`):</strong> Redirección de salida hacia archivos.</li>
              </ul>
              <p className="text-slate-400 pt-1">
                💡 Nota: Ya puedes consultar las fichas completas de `find`, `grep`, `|` y `&gt;` en la pestaña <strong>Glosario (man)</strong>.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRuta3Modal(false);
                  setScreen('P8');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Ver fichas en el Glosario
              </button>
              <button
                type="button"
                onClick={() => setShowRuta3Modal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Imprimible de Tarjeta de Repaso (Chuleta) */}
      {showCheatsheetModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Tarjeta de Repaso / Chuleta Descargable</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCheatsheetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-96">
              {getCheatsheetContent(summaryRouteId)}
            </pre>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => downloadCheatsheet(summaryRouteId)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Descargar archivo .md</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCheatsheetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showAiLabModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[88vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-emerald-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Tutor Socrático IA de LinuxLab</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Gemini 3 Flash
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consciente de tu carpeta actual (<code className="text-sky-300">{cwd}</code>) y de la actividad{' '}
                    <strong className="text-slate-200">{activeActivity?.codigo}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiLabModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[240px]">
              {aiTutorMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white ml-10'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 mr-6'
                  }`}
                >
                  <div className="font-semibold mb-1 text-[11px] opacity-80">
                    {m.role === 'user' ? 'Tú (ana@lab)' : '🤖 Tutor IA LinuxLab'}
                  </div>
                  {m.text}
                </div>
              ))}
              {aiTutorLoading && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 flex items-center gap-2 mr-6">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Gemini está analizando el estado de tu sistema de archivos...</span>
                </div>
              )}
            </div>

            {/* Quick Contextual Prompts */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                '¿Me das una pista socrática para mi objetivo actual?',
                '¿Por qué falló mi último comando en la terminal?',
                'Explícame la diferencia entre ruta absoluta y relativa',
                '¿Cómo uso rm sin riesgo de borrar algo importante?'
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={aiTutorLoading}
                  onClick={() => handleSendTutorQuestion(q)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTutorQuestion();
              }}
              className="flex items-center gap-2 pt-2 border-t border-slate-800"
            >
              <input
                type="text"
                value={aiTutorInput}
                onChange={(e) => setAiTutorInput(e.target.value)}
                placeholder="Pregúntale al Tutor IA sobre cualquier comando o sobre tu reto actual..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={aiTutorLoading || !aiTutorInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
