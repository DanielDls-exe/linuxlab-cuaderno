export const GLOSARIO_DATA = [{
  cmd: 'echo',
  categoria: 'Intro / Salida',
  sintaxis: 'echo [texto]',
  opciones: ['-n (no añade salto de línea final)'],
  riesgo: 'Seguro',
  descripcion: 'Imprime un mensaje de texto en la terminal. En este simulador no se expanden variables.',
  analogia: 'Como escribir una nota adhesiva y mostrarla en el monitor.',
  ejemplo: 'echo Hola Linux'
}, {
  cmd: 'pwd',
  categoria: 'Ruta 1 · Supervivencia',
  sintaxis: 'pwd',
  opciones: ['Sin opciones habituales'],
  riesgo: 'Seguro',
  descripcion: 'Muestra la ruta absoluta del directorio de trabajo actual (Print Working Directory).',
  analogia: 'Como mirar el pin de "Usted está aquí" en el mapa de un centro comercial o la barra de direcciones del explorador.',
  ejemplo: 'pwd'
}, {
  cmd: 'cd',
  categoria: 'Ruta 1 · Supervivencia',
  sintaxis: 'cd [ruta]',
  opciones: ['cd .. (sube un nivel a la carpeta padre)', 'cd ~ (va al directorio personal /home/ana)', 'cd - (regresa al directorio anterior)'],
  riesgo: 'Seguro',
  descripcion: 'Cambia el directorio actual para desplazarte por las carpetas del sistema.',
  analogia: 'Hacer doble clic sobre una carpeta en el explorador de archivos para entrar en ella.',
  ejemplo: 'cd /home/ana/docs'
}, {
  cmd: 'ls',
  categoria: 'Ruta 1 · Supervivencia',
  sintaxis: 'ls [opciones] [ruta]',
  opciones: ['-a (muestra archivos y carpetas ocultos que empiezan con punto .)', '-l (formato largo con permisos, propietario, tamaño y fecha)', '-la (combina formato largo e incluye ocultos)'],
  riesgo: 'Seguro',
  descripcion: 'Lista los archivos y subdirectorios contenidos dentro de una carpeta.',
  analogia: 'Abrir una ventana de carpeta y ver los íconos o la lista de detalles de sus archivos.',
  ejemplo: 'ls -la /home/ana'
}, {
  cmd: 'cat',
  categoria: 'Ruta 1 · Supervivencia',
  sintaxis: 'cat [archivo]',
  opciones: ['-n (enumera todas las líneas de salida)'],
  riesgo: 'Seguro',
  descripcion: 'Muestra de golpe todo el contenido de un archivo de texto directamente en la terminal.',
  analogia: 'Abrir un documento de bloc de notas rápido en modo solo lectura.',
  ejemplo: 'cat docs/pista.txt'
}, {
  cmd: 'less',
  categoria: 'Ruta 1 · Supervivencia',
  sintaxis: 'less [archivo]',
  opciones: ['Espacio (avanzar página)', 'q (salir del visor)'],
  riesgo: 'Seguro',
  descripcion: 'Permite leer archivos de texto extensos de forma paginada sin saturar la pantalla.',
  analogia: 'Leer un documento PDF desplazándote página por página con la rueda del ratón.',
  ejemplo: 'less docs/pista.txt'
}, {
  cmd: 'head',
  categoria: 'Ruta 1 · Supervivencia',
  sintaxis: 'head [opciones] [archivo]',
  opciones: ['-n X (muestra las primeras X líneas, por defecto 10)'],
  riesgo: 'Seguro',
  descripcion: 'Imprime únicamente las primeras líneas de un archivo de texto.',
  analogia: 'Leer solo el título y el primer párrafo de un informe para saber de qué trata.',
  ejemplo: 'head -n 2 docs/pista.txt'
}, {
  cmd: 'tail',
  categoria: 'Ruta 1 · Supervivencia',
  sintaxis: 'tail [opciones] [archivo]',
  opciones: ['-n X (muestra las últimas X líneas, por defecto 10)'],
  riesgo: 'Seguro',
  descripcion: 'Imprime las últimas líneas de un archivo, ideal para revisar registros recientes.',
  analogia: 'Ir directamente al final de un libro o leer los últimos mensajes de un chat.',
  ejemplo: 'tail notas.txt'
}, {
  cmd: 'mkdir',
  categoria: 'Ruta 2 · Manipulación',
  sintaxis: 'mkdir [opciones] [directorio]',
  opciones: ['-p (crea toda la jerarquía de carpetas padres e hijas si no existen)'],
  riesgo: 'Bajo',
  descripcion: 'Crea uno o más directorios nuevos (Make Directory).',
  analogia: 'Clic derecho en el escritorio › Nuevo › Carpeta.',
  ejemplo: 'mkdir -p web/assets/css'
}, {
  cmd: 'touch',
  categoria: 'Ruta 2 · Manipulación',
  sintaxis: 'touch [archivo]',
  opciones: ['Sin opciones habituales en nivel básico'],
  riesgo: 'Bajo',
  descripcion: 'Crea un archivo vacío nuevo si no existe, o actualiza su fecha de modificación si ya existe.',
  analogia: 'Clic derecho › Nuevo › Documento de texto vacío.',
  ejemplo: 'touch web/index.html'
}, {
  cmd: 'cp',
  categoria: 'Ruta 2 · Manipulación',
  sintaxis: 'cp [opciones] [origen] [destino]',
  opciones: ['-r (copia recursiva, obligatoria para copiar carpetas completas)', '-i (pregunta antes de sobrescribir un archivo existente)'],
  riesgo: 'Precaución',
  descripcion: 'Copia archivos o directorios desde una ruta de origen hacia un destino, conservando el original.',
  analogia: 'Seleccionar un archivo, presionar Ctrl+C y luego Ctrl+V en otra carpeta.',
  ejemplo: 'cp notas.txt docs/'
}, {
  cmd: 'mv',
  categoria: 'Ruta 2 · Manipulación',
  sintaxis: 'mv [origen] [destino]',
  opciones: ['-i (pregunta antes de sobrescribir un destino existente)'],
  riesgo: 'Precaución',
  descripcion: 'Mueve archivos/carpetas de lugar o les cambia el nombre si el destino está en la misma carpeta.',
  analogia: 'Cortar y pegar (Ctrl+X / Ctrl+V) para mover, o presionar F2 para cambiar el nombre.',
  ejemplo: 'mv *.jpg fotos/'
}, {
  cmd: 'rm',
  categoria: 'Ruta 2 · Manipulación',
  sintaxis: 'rm [opciones] [archivo]',
  opciones: ['-i (modo interactivo: pide confirmación antes de cada borrado)', '-r (borra directorios y todo su contenido recursivamente)', '-rf (forzado recursivo: ¡extremadamente peligroso!)'],
  riesgo: 'Alto (Irreversible)',
  descripcion: 'Elimina archivos o directorios de forma permanente sin pasar por la Papelera de reciclaje.',
  analogia: 'Presionar Shift+Supr en la interfaz gráfica (borrado definitivo instantáneo).',
  ejemplo: 'rm -i basura.tmp'
}, {
  cmd: 'rmdir',
  categoria: 'Ruta 2 · Manipulación',
  sintaxis: 'rmdir [directorio]',
  opciones: ['Solo funciona si el directorio está completamente vacío'],
  riesgo: 'Bajo',
  descripcion: 'Elimina un directorio únicamente si no contiene ningún archivo ni subcarpeta oculta.',
  analogia: 'Tirar una caja de cartón después de verificar que no quedó nada adentro.',
  ejemplo: 'rmdir carpeta_vacia'
}, {
  cmd: 'find',
  categoria: 'Ruta 3 · Búsqueda y flujo',
  sintaxis: 'find [ruta] -name "[patrón]"',
  opciones: ['-name (busca por nombre)', '-type f (solo archivos)', '-type d (solo carpetas)'],
  riesgo: 'Seguro',
  descripcion: 'Busca archivos y carpetas en una jerarquía de directorios según criterios como nombre o tipo.',
  analogia: 'Usar la lupa de búsqueda avanzada del explorador de archivos en toda una carpeta.',
  ejemplo: 'find /home/ana -name "*.txt"'
}, {
  cmd: 'grep',
  categoria: 'Ruta 3 · Búsqueda y flujo',
  sintaxis: 'grep [opciones] "[texto]" [archivo]',
  opciones: ['-i (ignora mayúsculas/minúsculas)', '-n (muestra el número de línea)'],
  riesgo: 'Seguro',
  descripcion: 'Filtra y busca líneas que contengan una palabra o patrón específico dentro de un archivo.',
  analogia: 'Presionar Ctrl+F dentro de un documento para resaltar todas las veces que aparece una palabra.',
  ejemplo: 'grep -i "pista" docs/pista.txt'
}, {
  cmd: '|',
  categoria: 'Ruta 3 · Búsqueda y flujo',
  sintaxis: 'comando1 | comando2',
  opciones: ['Operador de tubería (Pipe)'],
  riesgo: 'Seguro',
  descripcion: 'Conecta la salida del primer comando directamente como entrada del segundo comando.',
  analogia: 'Una cadena de montaje donde el resultado de una estación pasa directo a la siguiente.',
  ejemplo: 'ls -la | grep ".txt"'
}, {
  cmd: '>',
  categoria: 'Ruta 3 · Búsqueda y flujo',
  sintaxis: 'comando > [archivo]',
  opciones: ['> (sobrescribe el archivo)', '>> (añade al final sin borrar lo anterior)'],
  riesgo: 'Precaución',
  descripcion: 'Redirige el texto que saldría en pantalla y lo guarda dentro de un archivo.',
  analogia: 'En lugar de mostrar un reporte en el monitor, enviarlo directamente a "Guardar como archivo".',
  ejemplo: 'echo "Tarea terminada" > estado.txt'
}];

export const DIAGNOSTICO_QUESTIONS = [{
  id: 1,
  pregunta: 'Acabas de abrir la terminal y no sabes en qué carpeta del sistema te encuentras. ¿Qué comando te dice tu ubicación exacta?',
  opciones: [{
    id: 'a',
    texto: 'whereis'
  }, {
    id: 'b',
    texto: 'pwd',
    correcta: true
  }, {
    id: 'c',
    texto: 'cd'
  }, {
    id: 'd',
    texto: 'locate'
  }],
  explicacion: '`pwd` significa "Print Working Directory" e imprime la ruta absoluta actual (por ejemplo, /home/ana).'
}, {
  id: 2,
  pregunta: 'Si estás dentro de `/home/ana/proyectos/web` y quieres subir un nivel hacia `/home/ana/proyectos`, ¿qué debes ejecutar?',
  opciones: [{
    id: 'a',
    texto: 'cd /'
  }, {
    id: 'b',
    texto: 'cd ~'
  }, {
    id: 'c',
    texto: 'cd ..',
    correcta: true
  }, {
    id: 'd',
    texto: 'cd .'
  }],
  explicacion: 'En Linux, `..` representa siempre el directorio padre (un nivel arriba), mientras que `.` es el directorio actual.'
}, {
  id: 3,
  pregunta: 'En Linux, los archivos de configuración suelen estar ocultos y su nombre empieza con un punto (ej. `.bashrc`). ¿Cómo los haces visibles al listar?',
  opciones: [{
    id: 'a',
    texto: 'ls -l'
  }, {
    id: 'b',
    texto: 'ls -a',
    correcta: true
  }, {
    id: 'c',
    texto: 'ls -h'
  }, {
    id: 'd',
    texto: 'cat .*'
  }],
  explicacion: 'La opción `-a` (all) de `ls` muestra todos los elementos, incluyendo los ocultos que inician con punto (`.`).'
}, {
  id: 4,
  pregunta: 'Necesitas crear una carpeta nueva llamada `respaldo` en tu ubicación actual. ¿Cuál es el comando apropiado?',
  opciones: [{
    id: 'a',
    texto: 'touch respaldo'
  }, {
    id: 'b',
    texto: 'newdir respaldo'
  }, {
    id: 'c',
    texto: 'mkdir respaldo',
    correcta: true
  }, {
    id: 'd',
    texto: 'cp respaldo'
  }],
  explicacion: '`mkdir` (Make Directory) crea carpetas nuevas, mientras que `touch` crea archivos vacíos.'
}, {
  id: 5,
  pregunta: '¿Por qué debes revisar cuidadosamente los objetivos antes de usar `rm -rf` sobre una carpeta?',
  opciones: [{
    id: 'a',
    texto: 'Porque reinicia el computador sin guardar los cambios.'
  }, {
    id: 'b',
    texto: 'Porque borra archivos y carpetas recursivamente al instante, sin confirmación y sin pasar por la Papelera.',
    correcta: true
  }, {
    id: 'c',
    texto: 'Porque bloquea la contraseña del usuario actual.'
  }, {
    id: 'd',
    texto: 'Porque mueve todos los archivos a una carpeta oculta.'
  }],
  explicacion: '`rm` no usa papelera: -r incluye el contenido de las carpetas y -f evita confirmaciones. El laboratorio añade su propia confirmación. GNU rm protege la raíz / de forma predeterminada; esa protección no sustituye revisar qué vas a borrar.'
}];

export function createBaseVFS(type = 'ruta1') {
  const base = {
    '/': {
      type: 'dir',
      children: ['home']
    },
    '/home': {
      type: 'dir',
      children: ['ana']
    },
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
    base['/home/ana'].children = ['docs', 'proyectos', 'notas.txt'];
  }
  if (type === 'ruta2_22') {
    base['/home/ana'].children = ['docs', 'proyectos', 'notas.txt', 'borrador.txt'];
    base['/home/ana/borrador.txt'] = {
      type: 'file',
      size: 88,
      date: '18 Oct 13:10',
      content: 'Versión preliminar del documento de arquitectura de software.'
    };
  }
  if (type === 'ruta2_23') {
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
    base['/home/ana'].children = ['docs', 'servidor.log', 'notas.txt'];
    base['/home/ana/servidor.log'] = {
      type: 'file',
      size: 680,
      date: '18 Oct 17:30',
      content: ['2026-10-18 08:00:01 [INFO] Servicio web iniciado en el puerto 8080', '2026-10-18 08:04:12 [INFO] Conexión establecida desde 192.168.1.15', '2026-10-18 08:15:44 [ERROR] Fallo de conexión con la base de datos primaria', '2026-10-18 08:16:02 [WARN] Reintentando conexión en modo seguro', '2026-10-18 08:19:50 [INFO] Usuario ana inició sesión correctamente', '2026-10-18 08:22:10 [ERROR] Tiempo de espera agotado en el módulo de pagos', '2026-10-18 08:30:00 [INFO] Respaldo automático completado'].join('\n')
    };
  }
  if (type === 'ruta3_33') {
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
      content: ['2026-10-18 09:00 [INFO] Nodo 1 activo', '2026-10-18 09:05 [ERROR] Disco al 95% de capacidad', '2026-10-18 09:10 [INFO] Limpieza programada', '2026-10-18 09:15 [ERROR] Puerto 443 bloqueado temporalmente'].join('\n')
    };
  }
  if (type === 'ruta3_34') {
    base['/home/ana'].children = ['docs', 'servidor.log', 'notas.txt'];
    base['/home/ana/servidor.log'] = {
      type: 'file',
      size: 480,
      date: '18 Oct 18:30',
      content: ['2026-10-18 10:01 [INFO] Sistema operativo actualizado', '2026-10-18 10:04 [ERROR] Certificado SSL próximo a vencer', '2026-10-18 10:09 [ERROR] Intento de acceso no autorizado bloqueado'].join('\n')
    };
  }
  if (type === 'reto3') {
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
      content: ['10:00 GET /index.html 200 OK - usuario: ana', '10:02 GET /panel 200 OK - usuario: carlos', '10:05 POST /login 403 FORBIDDEN - ALERTA: INTRUSO detectado desde IP 203.0.113.50'].join('\n')
    };
    base['/home/ana/auditoria/seguridad'] = {
      type: 'dir',
      children: ['firewall.log']
    };
    base['/home/ana/auditoria/seguridad/firewall.log'] = {
      type: 'file',
      size: 390,
      date: '18 Oct 19:10',
      content: ['10:01 [OK] Tráfico interno permitido en eth0', '10:05 [CRITICO] INTRUSO bloqueado intentando abrir puerto 22 SSH', '10:06 [OK] Reglas de cortafuegos sincronizadas', '10:08 [CRITICO] INTRUSO intentó escalar privilegios con clave inválida'].join('\n')
    };
  }
  return JSON.parse(JSON.stringify(base));
}

export const CURRICULUM = [{
  id: '0.1',
  rutaId: 'intro',
  rutaTitulo: 'Introducción',
  codigo: 'Lección 0.1',
  titulo: '¿Qué es la terminal?',
  tipo: 'leccion',
  vfsPreset: 'ruta1',
  initialCwd: '/home/ana',
  parrafos: ['¡Bienvenido/a a LinuxLab! La terminal (o consola) no es una pantalla mágica para hackers de películas: es simplemente otra forma de conversar con tu computador mediante texto en lugar de hacer clics con el ratón.', 'Observa el texto `ana@linuxlab:~$` en la consola derecha. Eso se llama el **prompt** y te indica quién eres (`ana`), en qué máquina estás (`linuxlab`), tu carpeta actual (`~` representa tu carpeta personal `/home/ana`) y el símbolo `$` que significa "estoy listo para recibir órdenes".', 'Todo comando en Linux sigue una anatomía muy sencilla: `comando + opciones + argumentos`. Vamos a romper el hielo pidiéndole a la terminal que repita un saludo con el comando `echo`.'],
  analogia: 'Usar la terminal es como enviarle un mensaje directo por chat al sistema operativo en vez de buscar botones en menús.',
  ejemploCmd: 'echo Hola Linux',
  objetivoTexto: 'Escribe y ejecuta el comando `echo Hola Linux` en la terminal para recibir tu primera respuesta del sistema.',
  pistas: ['El comando `echo` toma cualquier texto que escribas después de un espacio y lo muestra en pantalla.', 'La estructura que debes escribir es: echo <espacio> Hola Linux', 'echo Hola Linux'],
  comandosAprendidos: ['echo']
}, {
  id: '0.2',
  rutaId: 'intro',
  rutaTitulo: 'Introducción',
  codigo: 'Lección 0.2',
  titulo: 'Diagnóstico inicial',
  tipo: 'diagnostico'
}, {
  id: '1.1',
  rutaId: 'ruta1',
  rutaTitulo: 'Ruta 1: Supervivencia básica',
  codigo: 'Lección 1.1',
  titulo: '¿Dónde estoy? (pwd)',
  tipo: 'leccion',
  vfsPreset: 'ruta1',
  initialCwd: '/home/ana',
  parrafos: ['En Linux, todos los archivos y carpetas viven dentro de un gran árbol invertido que nace en el **directorio raíz**, representado por una sola barra inclinada (`/`).', 'Dentro de `/` existe la carpeta `/home`, y dentro de ella está tu espacio privado de trabajo: `/home/ana` (también abreviado con la virgulilla `~`).', 'Cuando trabajas en la consola, la primera regla de supervivencia es saber siempre en qué rama del árbol estás parado/a. El comando `pwd` (Print Working Directory) te responde exactamente eso.'],
  analogia: 'Ejecutar `pwd` equivale a mirar el cartel de "Usted está aquí" en el mapa de una estación de metro o leer la barra de ruta superior del Explorador de Windows/Finder.',
  ejemploCmd: 'pwd',
  objetivoTexto: 'Ejecuta el comando `pwd` en la terminal para verificar la ruta absoluta de tu directorio actual.',
  pistas: ['Recuerda las siglas en inglés de "Print Working Directory" (Imprimir Directorio de Trabajo).', 'Es un comando de solo 3 letras sin opciones ni argumentos.', 'pwd'],
  comandosAprendidos: ['pwd']
}, {
  id: '1.2',
  rutaId: 'ruta1',
  rutaTitulo: 'Ruta 1: Supervivencia básica',
  codigo: 'Lección 1.2',
  titulo: 'Moverse por el árbol (cd)',
  tipo: 'leccion',
  vfsPreset: 'ruta1',
  initialCwd: '/home/ana',
  parrafos: ['Ahora que sabes dónde estás, aprendamos a caminar por las carpetas usando `cd` (Change Directory). Puedes indicarle el destino de dos maneras: con una **ruta relativa** (partiendo de donde estás, ej. `cd docs`) o con una **ruta absoluta** (empezando desde la raíz `/`, ej. `cd /home/ana/docs`).', 'Además, `cd` tiene tres atajos súper útiles: `cd ..` sube un nivel hacia la carpeta padre, `cd ~` te devuelve de inmediato a `/home/ana` desde cualquier rincón, y `cd -` te regresa a la carpeta donde estabas justo antes.', 'Observa el panel del "Árbol de directorios visual" debajo de la terminal: verás cómo la insignia `📍 TÚ ESTÁS AQUÍ` se mueve contigo en tiempo real.'],
  analogia: 'Hacer `cd docs` es exactamente igual que hacer doble clic sobre la carpeta "docs" con el ratón. Hacer `cd ..` es presionar el botón "Atrás / Subir nivel".',
  ejemploCmd: 'cd docs',
  objetivoTexto: 'Desplázate dentro del directorio `/home/ana/docs` utilizando el comando `cd`.',
  pistas: ['Como ya estás en `/home/ana`, puedes usar una ruta relativa indicando solo el nombre de la carpeta destino, o la ruta completa.', 'Escribe `cd` seguido de un espacio y el nombre de la carpeta `docs`.', 'cd docs'],
  comandosAprendidos: ['cd']
}, {
  id: '1.3',
  rutaId: 'ruta1',
  rutaTitulo: 'Ruta 1: Supervivencia básica',
  codigo: 'Lección 1.3',
  titulo: 'Mirar alrededor (ls)',
  tipo: 'leccion',
  vfsPreset: 'ruta1',
  initialCwd: '/home/ana',
  parrafos: ['Entrar a una carpeta a ciegas no sirve de mucho si no podemos ver qué hay adentro. El comando `ls` (List) muestra los archivos y subdirectorios de tu ubicación actual.', 'Sin embargo, `ls` por sí solo guarda un secreto: en Linux, cualquier archivo o carpeta cuyo nombre empiece con un punto (ej. `.config_secreta`) es un **archivo oculto** y no aparece en un listado normal.', 'Si agregas la opción `-a` (`ls -a`), le ordenas mostrar absolutamente todo, incluidos los ocultos. Y si usas `ls -l` o `ls -la`, verás una tabla detallada con permisos, fechas y tamaños.'],
  analogia: 'Usar `ls -a` equivale a activar la casilla "Mostrar elementos ocultos" en la pestaña Vista del explorador de archivos.',
  ejemploCmd: 'ls -a',
  objetivoTexto: 'Usa `ls -a` (o `ls -la`) dentro de `/home/ana` para revelar el archivo oculto `.config_secreta`.',
  pistas: ['Primero prueba `ls` a secas y notarás que `.config_secreta` no aparece. Necesitas añadirle la bandera de "all" (todos).', 'Estructura: `ls` + espacio + `-a` (asegúrate de estar en `/home/ana`).', 'ls -a'],
  comandosAprendidos: ['ls']
}, {
  id: '1.4',
  rutaId: 'ruta1',
  rutaTitulo: 'Ruta 1: Supervivencia básica',
  codigo: 'Lección 1.4',
  titulo: 'Leer archivos sin miedo (cat, less, head, tail)',
  tipo: 'leccion',
  vfsPreset: 'ruta1',
  initialCwd: '/home/ana',
  parrafos: ['Para leer qué dice un archivo de texto en la terminal no necesitas abrir un programa pesado como Word. Tienes cuatro herramientas ligeras y 100 % seguras porque solo leen el archivo sin modificarlo.', '`cat archivo` vuelca todo el texto en pantalla de una vez. Si el archivo es muy largo, `less archivo` lo muestra paginado; `head archivo` enseña solo las primeras líneas y `tail archivo` las últimas.', 'Puedes leer un archivo entrando primero a su carpeta (`cd docs` y luego `cat pista.txt`) o pasándole su ruta relativa directamente (`cat docs/pista.txt`).'],
  analogia: 'Es como usar la "Vista previa rápida" (barra espaciadora en Mac o panel de vista previa en Windows) para leer una nota al instante.',
  ejemploCmd: 'cat docs/pista.txt',
  objetivoTexto: 'Inspecciona el contenido del archivo `/home/ana/docs/pista.txt` usando `cat` (también puedes usar `less`, `head` o `tail`).',
  pistas: ['Puedes ejecutar el comando desde `/home/ana` apuntando a `docs/pista.txt`, o entrar primero con `cd docs` y leer `pista.txt`.', 'Estructura: `cat <ruta_del_archivo>`', 'cat /home/ana/docs/pista.txt'],
  comandosAprendidos: ['cat', 'less', 'head', 'tail']
}, {
  id: 'reto1',
  rutaId: 'ruta1',
  rutaTitulo: 'Ruta 1: Supervivencia básica',
  codigo: 'Reto 1',
  titulo: 'Búsqueda del tesoro en el árbol de directorios',
  tipo: 'reto',
  vfsPreset: 'reto1',
  initialCwd: '/home/ana',
  escenario: '¡Hora de poner a prueba tus habilidades de supervivencia! Un docente dejó escondido un código secreto de acceso dentro de tu laboratorio. Sabemos que está oculto en algún lugar dentro de `/home/ana/proyectos`. Explora sin miedo: ninguno de los comandos de esta ruta puede dañar el sistema.',
  insigniaId: 'explorador',
  insigniaNombre: 'Explorador del sistema de archivos',
  comandosAprendidos: ['pwd', 'cd', 'ls', 'cat'],
  pistasReto: ['Empieza moviéndote a la carpeta de proyectos con `cd /home/ana/proyectos` (o `cd proyectos`).', 'Una vez en `proyectos`, recuerda que los nombres que inician con punto están ocultos. Usa `ls -a` para ver la carpeta `.tesoro`.', 'Entra con `cd .tesoro` y lee el archivo con `cat clave.txt`.'],
  metasVisuales: ['Ubicarse en `/home/ana/proyectos` o subcarpeta `.tesoro`', 'Descubrir el directorio oculto `/home/ana/proyectos/.tesoro` con `ls -a`', 'Leer el contenido de `/home/ana/proyectos/.tesoro/clave.txt`'],
  checklist: [{
    id: 'c1',
    texto: '1. Ir a la carpeta `/home/ana/proyectos` usando `cd`'
  }, {
    id: 'c2',
    texto: '2. Listar los archivos ocultos con `ls -a` para descubrir la carpeta `.tesoro`'
  }, {
    id: 'c3',
    texto: '3. Entrar a `.tesoro` y leer el archivo `clave.txt` con `cat`'
  }]
}, {
  id: '2.1',
  rutaId: 'ruta2',
  rutaTitulo: 'Ruta 2: Manipulación segura',
  codigo: 'Lección 2.1',
  titulo: 'Crear carpetas y archivos (mkdir, touch)',
  tipo: 'leccion',
  vfsPreset: 'ruta2_21',
  initialCwd: '/home/ana',
  parrafos: ['¡Bienvenido/a a la Ruta 2! Ya sabes explorar el sistema; ahora aprenderás a construir y organizar tu propio espacio de trabajo.', 'Para crear una carpeta nueva usamos `mkdir nombre_carpeta` (Make Directory). Si necesitas crear una carpeta y dentro otra subcarpeta de un solo golpe (por ejemplo `mkdir -p proyecto/src`), la opción `-p` crea toda la ruta sin dar error.', 'Por su parte, para crear un archivo vacío listo para trabajar usamos `touch nombre_archivo` (por ejemplo, `touch web/index.html`).'],
  analogia: '`mkdir` es "Clic derecho › Nueva carpeta", y `touch` es "Clic derecho › Nuevo documento de texto en blanco".',
  ejemploCmd: 'mkdir web',
  objetivoTexto: 'Crea una carpeta llamada `web` dentro de `/home/ana` y dentro de ella crea un archivo vacío llamado `index.html`.',
  pistas: ['Necesitas dos pasos: primero crear el directorio `web` con `mkdir` y luego el archivo `index.html` dentro con `touch`.', 'Ejecuta primero `mkdir web` y después `touch web/index.html` (o entra con `cd web` y haz `touch index.html`).', 'mkdir web && touch web/index.html'],
  comandosAprendidos: ['mkdir', 'touch']
}, {
  id: '2.2',
  rutaId: 'ruta2',
  rutaTitulo: 'Ruta 2: Manipulación segura',
  codigo: 'Lección 2.2',
  titulo: 'Copiar, mover y renombrar (cp, mv)',
  tipo: 'leccion',
  vfsPreset: 'ruta2_22',
  initialCwd: '/home/ana',
  parrafos: ['Para duplicar un archivo usamos `cp origen destino` (Copy). Por ejemplo, `cp notas.txt docs/` crea una copia idéntica dentro de `docs` conservando el original. Si algún día quieres copiar una carpeta entera con todo su contenido, deberás añadir `-r` (`cp -r carpeta copia_carpeta`).', 'En cambio, `mv origen destino` (Move) tiene un doble superpoder: si el destino es una carpeta existente, **mueve** el archivo hacia allá; pero si el destino es un nombre nuevo en la misma carpeta (ej. `mv borrador.txt final.txt`), simplemente **le cambia el nombre**.', 'En esta práctica harás las dos operaciones: primero copia un archivo y después renombra otro. Observa sus diferencias en el árbol visual.'],
  analogia: '`cp` es Copiar y Pegar (Ctrl+C / Ctrl+V). `mv` es Cortar y Pegar (Ctrl+X / Ctrl+V) o pulsar F2 para renombrar un archivo.',
  ejemploCmd: 'cp notas.txt docs/',
  objetivoTexto: 'Copia `notas.txt` dentro de `docs/` con `cp` y renombra `borrador.txt` a `final.txt` con `mv`. Completa ambas operaciones.',
  pistas: ['Recuerda que tanto `cp` como `mv` reciben primero el archivo de origen y luego el destino separados por un espacio.', 'Para copiar: `cp notas.txt docs/` | Para renombrar: `mv borrador.txt final.txt`', 'cp notas.txt docs/ && mv borrador.txt final.txt'],
  comandosAprendidos: ['cp', 'mv']
}, {
  id: '2.3',
  rutaId: 'ruta2',
  rutaTitulo: 'Ruta 2: Manipulación segura',
  codigo: 'Lección 2.3',
  titulo: 'Borrar con cuidado y Modo Seguro (rm, rmdir)',
  tipo: 'leccion',
  vfsPreset: 'ruta2_23',
  initialCwd: '/home/ana',
  parrafos: ['Llegamos al comando que más respeto inspira en Linux: `rm` (Remove). A diferencia de Windows o macOS, cuando borras algo en la terminal con `rm`, **no va a la Papelera de reciclaje**: desaparece al instante.', 'Por eso existen buenos hábitos profesionales: usar `rm -i archivo` para que la consola te pida confirmación antes de borrar, usar `rmdir` para borrar carpetas vacías con seguridad, y jamás ejecutar `rm -rf` a la ligera.', 'En **LinuxLab** hemos integrado un **Modo Seguro Anti-ansiedad**: cada vez que uses `rm`, la terminal pausará la acción en amarillo y te preguntará `¿confirmas borrar <nombre>? [s/N]`. Escribe `s` y Enter para confirmar.'],
  analogia: 'Usar `rm` con confirmación (`-i` o nuestro Modo Seguro) es como el cuadro de diálogo "¿Está seguro de que desea eliminar este elemento permanentemente?".',
  ejemploCmd: 'rm basura.tmp',
  objetivoTexto: 'Elimina únicamente el archivo `basura.tmp` con `rm basura.tmp` y confirma la operación escribiendo `s` en el Modo Seguro (sin borrar `importante.txt`).',
  pistas: ['Primero escribe el comando para borrar `basura.tmp` y presiona Enter.', 'Verás un aviso amarillo del Modo Seguro pidiendo confirmación `[s/N]`. Escribe la letra `s` y presiona Enter.', 'rm basura.tmp'],
  comandosAprendidos: ['rm', 'rmdir']
}, {
  id: '2.4',
  rutaId: 'ruta2',
  rutaTitulo: 'Ruta 2: Manipulación segura',
  codigo: 'Lección 2.4',
  titulo: 'El poder de los comodines (* y ?)',
  tipo: 'leccion',
  vfsPreset: 'ruta2_24',
  initialCwd: '/home/ana',
  parrafos: ['Imagina tener 200 fotografías mezcladas con documentos y querer moverlas todas a una carpeta. Hacerlo una por una sería agotador. Aquí entran los **comodines (wildcards)**.', 'El asterisco `*` representa "cualquier cantidad de caracteres". Así, `*.jpg` selecciona todos los archivos que terminen en `.jpg` (`foto1.jpg`, `foto2.jpg`, etc.). El signo `?` representa "exactamente un carácter" (ej. `foto?.jpg`).', '**Regla de oro de seguridad:** Antes de usar `*` con `mv` o `rm`, haz siempre una vista previa inocua con `ls *.jpg` para estar 100 % seguro de qué archivos estás seleccionando.'],
  analogia: 'Usar `*.jpg` es como escribir ".jpg" en el filtro de una carpeta y presionar "Seleccionar todos los resultados" de una sola vez.',
  ejemploCmd: 'mv *.jpg imagenes',
  objetivoTexto: 'Mueve todos los archivos `.jpg` (`foto1.jpg` y `foto2.jpg`) dentro de la carpeta `imagenes/` en un solo comando usando comodines (`mv *.jpg imagenes`).',
  pistas: ['Puedes probar primero `ls *.jpg` para ver que selecciona `foto1.jpg` y `foto2.jpg`.', 'Usa el comando `mv` seguido del patrón `*.jpg` y luego el nombre de la carpeta destino `imagenes`.', 'mv *.jpg imagenes'],
  comandosAprendidos: ['* (comodines)']
}, {
  id: 'reto2',
  rutaId: 'ruta2',
  rutaTitulo: 'Ruta 2: Manipulación segura',
  codigo: 'Reto 2',
  titulo: 'Ordena la carpeta descargas',
  tipo: 'reto',
  vfsPreset: 'reto2',
  initialCwd: '/home/ana/descargas',
  escenario: 'El directorio `/home/ana/descargas` es un caos total: tiene fotos sueltas (`vacaciones.jpg`, `perfil.jpg`), un documento importante (`informe.pdf`) y un archivo basura (`temp.txt`). Tu misión es organizar la carpeta sin perder el informe PDF.',
  insigniaId: 'guardian',
  insigniaNombre: 'Guardián de la manipulación segura',
  comandosAprendidos: ['mkdir', 'touch', 'cp', 'mv', 'rm', 'rmdir', '*.jpg'],
  pistasReto: ['Verifica que estés en `/home/ana/descargas` (ya iniciamos ahí, puedes comprobarlo con `pwd`). Crea la carpeta con `mkdir fotos`.', 'Para mover todas las imágenes de una vez usa el comodín: `mv *.jpg fotos`.', 'Para eliminar el archivo temporal usa `rm temp.txt` y confirma escribiendo `s` cuando aparezca el Modo Seguro.'],
  metasVisuales: ['Carpeta `/home/ana/descargas/fotos` creada', '`vacaciones.jpg` y `perfil.jpg` dentro de `fotos/`', '`temp.txt` eliminado de `descargas/`', '`informe.pdf` conservado a salvo en `descargas/`'],
  checklist: [{
    id: 'r2_1',
    texto: '1. Crear la carpeta `fotos` dentro de `descargas` (`mkdir fotos`)'
  }, {
    id: 'r2_2',
    texto: '2. Mover todos los archivos `.jpg` a la carpeta `fotos` usando comodines (`mv *.jpg fotos`)'
  }, {
    id: 'r2_3',
    texto: '3. Borrar el archivo `temp.txt` confirmando en el Modo Seguro (`rm temp.txt` → `s`) conservando `informe.pdf`'
  }]
}, {
  id: '3.1',
  rutaId: 'ruta3',
  rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
  codigo: 'Lección 3.1',
  titulo: 'Buscar archivos en el árbol (find)',
  tipo: 'leccion',
  vfsPreset: 'ruta3_31',
  initialCwd: '/home/ana',
  parrafos: ['¡Bienvenido/a a la Ruta 3! Cuando un servidor o proyecto crece, buscar archivos entrando carpeta por carpeta con `cd` y `ls` se vuelve imposible. Para eso existe el radar de Linux: el comando `find`.', 'Su estructura es muy intuitiva: `find [dónde_buscar] -name "[patrón]"`. Si pones un punto (`.`) como lugar de búsqueda, `find` rastreará a partir de tu carpeta actual y todas sus subcarpetas automáticamente.', 'Por ejemplo, `find . -name "*.txt"` recorrerá todas las ramas y te mostrará la ruta exacta de cada archivo terminado en `.txt`, sin importar qué tan profundo esté escondido.'],
  analogia: 'Usar `find` es como escribir "*.txt" en el cuadro de búsqueda superior del explorador de archivos con la opción "Buscar en todas las subcarpetas" activada.',
  ejemploCmd: 'find . -name "*.txt"',
  objetivoTexto: 'Usa el comando `find` desde `/home/ana` para localizar todos los archivos `.txt` escondidos en las subcarpetas (`find . -name "*.txt"`).',
  pistas: ['Recuerda indicar primero la ruta donde buscar (`.` para el directorio actual o `/home/ana`) seguida de `-name` y el patrón entre comillas.', 'Estructura: `find . -name "*.txt"`', 'find . -name "*.txt"'],
  comandosAprendidos: ['find']
}, {
  id: '3.2',
  rutaId: 'ruta3',
  rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
  codigo: 'Lección 3.2',
  titulo: 'Filtrar contenido de texto (grep)',
  tipo: 'leccion',
  vfsPreset: 'ruta3_32',
  initialCwd: '/home/ana',
  parrafos: ['Mientras que `find` busca archivos por su nombre en las carpetas, `grep` busca **palabras o frases por dentro del contenido** de un archivo de texto.', 'Imagina un archivo `servidor.log` con miles de líneas de actividad, pero a ti solo te interesan los errores. Si ejecutas `grep "ERROR" servidor.log`, la terminal ocultará el ruido y te mostrará únicamente las líneas que contengan esa palabra.', 'Además, puedes agregar `-i` para ignorar mayúsculas/minúsculas (`grep -i "error" servidor.log`) o `-n` para ver el número exacto de línea donde ocurrió (`grep -n "ERROR" servidor.log`).'],
  analogia: '`grep` es el equivalente a abrir un documento grande, presionar `Ctrl+F`, escribir "ERROR" y extraer una lista con solo los renglones donde aparece.',
  ejemploCmd: 'grep "ERROR" servidor.log',
  objetivoTexto: 'Filtra el archivo `servidor.log` usando `grep` para mostrar únicamente las líneas que contienen la palabra `ERROR`.',
  pistas: ['El comando `grep` recibe primero el texto buscado y luego el nombre del archivo donde buscar.', 'Estructura: `grep "ERROR" servidor.log` (o `grep -n "ERROR" servidor.log`).', 'grep "ERROR" servidor.log'],
  comandosAprendidos: ['grep']
}, {
  id: '3.3',
  rutaId: 'ruta3',
  rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
  codigo: 'Lección 3.3',
  titulo: 'Conectar comandos con tuberías (|)',
  tipo: 'leccion',
  vfsPreset: 'ruta3_33',
  initialCwd: '/home/ana',
  parrafos: ['Aquí descubrirás la verdadera filosofía de Linux: combinar herramientas pequeñas para lograr tareas poderosas. El operador de **tubería o pipe (`|`)** toma la salida de texto del comando de la izquierda y la conecta directamente como entrada del comando de la derecha.', 'Por ejemplo, si haces `ls -la | grep ".txt"`, el comando `ls -la` genera la lista de archivos y, en lugar de volcarla toda en pantalla, se la pasa por la tubería a `grep`, el cual deja pasar solo los renglones que tengan `.txt`.', 'También puedes encadenar `cat servidor.log | grep "ERROR"` o `ls | head -n 3`.'],
  analogia: 'Una tubería (`|`) es como acoplar un filtro purificador directamente a la salida del grifo de agua: lo que sale del primero se filtra en el segundo.',
  ejemploCmd: 'ls -la | grep ".txt"',
  objetivoTexto: 'Usa una tubería (`|`) para combinar `ls` (o `cat`) con `grep` (por ejemplo: `ls -la | grep ".txt"` o `cat servidor.log | grep "ERROR"`).',
  pistas: ['Escribe dos comandos separados por la barra vertical `|` (en muchos teclados se saca con AltGr + 1 o al lado de la tecla Enter/Shift).', 'Puedes hacer clic en el bloque de ejemplo interactivo si no encuentras el símbolo `|` en tu teclado.', 'ls -la | grep ".txt"'],
  comandosAprendidos: ['|']
}, {
  id: '3.4',
  rutaId: 'ruta3',
  rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
  codigo: 'Lección 3.4',
  titulo: 'Guardar salidas en archivos (> y >>)',
  tipo: 'leccion',
  vfsPreset: 'ruta3_34',
  initialCwd: '/home/ana',
  parrafos: ['Hasta ahora, el resultado de todos tus comandos aparecía en la pantalla y luego se perdía. Con el operador de **redirección (`>`)** puedes capturar esa salida y guardarla automáticamente dentro de un archivo de texto nuevo.', 'Existe una diferencia vital entre `>` y `>>`: un solo símbolo `>` **crea el archivo o sobrescribe (borra)** lo que hubiera antes en él; mientras que el doble símbolo `>>` **agrega el texto al final** respetando el contenido previo.', 'Por ejemplo, `grep "ERROR" servidor.log > reporte_errores.txt` filtrará los errores y los dejará guardados en `reporte_errores.txt`.'],
  analogia: 'Usar `>` es como elegir "Guardar como..." reemplazando el archivo, mientras que `>>` es abrir una libreta y escribir en el último renglón libre.',
  ejemploCmd: 'grep "ERROR" servidor.log > reporte_errores.txt',
  objetivoTexto: 'Filtra las líneas con `ERROR` de `servidor.log` y guárdalas en un archivo llamado `reporte_errores.txt` usando redirección (`>`).',
  pistas: ['Observa que al redirigir con `>`, la salida no se imprime en la pantalla porque va directo al archivo. ¡Verás cómo aparece `reporte_errores.txt` en el árbol de directorios!', 'Estructura: `grep "ERROR" servidor.log > reporte_errores.txt`', 'grep "ERROR" servidor.log > reporte_errores.txt'],
  comandosAprendidos: ['>', '>>']
}, {
  id: 'reto3',
  rutaId: 'ruta3',
  rutaTitulo: 'Ruta 3: Búsqueda y flujo de datos',
  codigo: 'Reto 3',
  titulo: 'Auditoría de registros del servidor',
  tipo: 'reto',
  vfsPreset: 'reto3',
  initialCwd: '/home/ana/auditoria',
  escenario: '¡Alerta de seguridad en el laboratorio! Se sospecha que alguien intentó acceder sin permiso a los servidores. Estás en `/home/ana/auditoria`, donde hay varias subcarpetas. Tu misión como auditor/a es localizar todos los archivos `.log`, filtrar los renglones que contengan la palabra `INTRUSO` y guardar la evidencia en `/home/ana/auditoria/evidencia.txt`.',
  insigniaId: 'maestro_flujo',
  insigniaNombre: 'Maestro del flujo y auditoría',
  comandosAprendidos: ['find', 'grep', '|', '>', '>>'],
  pistasReto: ['Paso 1: Ejecuta `find . -name "*.log"` para descubrir en qué subcarpetas están los registros (`web/acceso.log` y `seguridad/firewall.log`).', 'Paso 2: Filtra los eventos sospechosos con `grep "INTRUSO" seguridad/firewall.log` o `grep "INTRUSO" web/acceso.log`.', 'Paso 3: Guarda el resultado en `evidencia.txt` ejecutando: `grep "INTRUSO" seguridad/firewall.log > evidencia.txt`.'],
  metasVisuales: ['Ejecutar `find` para localizar los archivos `.log` en las subcarpetas de `auditoria/`', 'Inspeccionar o filtrar las líneas con la palabra `INTRUSO` usando `grep`', 'Crear `/home/ana/auditoria/evidencia.txt` con las líneas de `INTRUSO` usando `>` o `>>`'],
  checklist: [{
    id: 'r3_1',
    texto: '1. Localizar los archivos `.log` dentro de `auditoria` usando `find` (`find . -name "*.log"`)'
  }, {
    id: 'r3_2',
    texto: '2. Filtrar las alertas que contienen la palabra `INTRUSO` usando `grep`'
  }, {
    id: 'r3_3',
    texto: '3. Guardar las líneas filtradas con `INTRUSO` dentro de `/home/ana/auditoria/evidencia.txt` usando `>`'
  }]
}];


export const ROUTES = [
  { id: 'ruta1', number: '01', title: 'Encuentra tu lugar.', name: 'Supervivencia básica', description: 'Ubícate, recorre carpetas y descubre lo que guardan los archivos.', commands: ['pwd', 'cd', 'ls', 'cat'], color: 'orange', badge: 'Explorador del sistema de archivos' },
  { id: 'ruta2', number: '02', title: 'Pon todo en orden.', name: 'Manipulación segura', description: 'Crea, copia y mueve. Aprende a borrar con intención, sin miedo.', commands: ['mkdir', 'cp', 'mv', 'rm'], color: 'blue', badge: 'Guardián de la manipulación segura' },
  { id: 'ruta3', number: '03', title: 'Sigue las pistas.', name: 'Búsqueda y flujo de datos', description: 'Encuentra lo importante y conecta comandos para llegar más lejos.', commands: ['find', 'grep', '|', '>'], color: 'green', badge: 'Maestro del flujo y auditoría' },
];

export const EXTRA_GLOSSARY = [
  { cmd: 'wc', categoria: 'Ruta 3 · Búsqueda y flujo', sintaxis: 'wc [-lwc] [archivo]', opciones: ['-l: líneas (saltos de línea)', '-w: palabras', '-c: bytes'], riesgo: 'Seguro', descripcion: 'Cuenta líneas, palabras y bytes de un archivo o de una entrada recibida por tubería.', analogia: 'Como el contador de palabras de un editor de texto.', ejemplo: 'cat notas.txt | wc -l' },
  { cmd: 'sort', categoria: 'Ruta 3 · Búsqueda y flujo', sintaxis: 'sort [-ru] [archivo]', opciones: ['-r: orden inverso', '-u: elimina líneas duplicadas'], riesgo: 'Seguro', descripcion: 'Ordena las líneas de un archivo o de una entrada recibida por tubería.', analogia: 'Como ordenar una columna de texto en una hoja de cálculo.', ejemplo: 'cat notas.txt | sort' },
];
