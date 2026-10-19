# 🐧 `>_ LinuxLab` · Plataforma Educativa de Comandos Linux

[![Desplegar en GitHub Pages](https://github.com/luisangelaraujo/linuxlab/actions/workflows/deploy.yml/badge.svg)](https://github.com/luisangelaraujo/linuxlab)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-cyan.svg)](https://tailwindcss.com/)
[![Gemini IA](https://img.shields.io/badge/Gemini-AI-orange.svg)](https://ai.google.dev/)

> *«La terminal no muerde»* — Plataforma interactiva y Producto Mínimo Viable (PMV) de Recursos Educativos Digitales (RED) diseñada para aprender y practicar comandos de Linux paso a paso en un entorno web seguro, aislado y con asistencia inteligente.

---

## ✨ Características Principales

* 💻 **Emulador de Terminal en Memoria (Estilo `xterm.js`):** Interfaz oscura de alto contraste (`#121417`) con prompt interactivo (`ana@lab:~$`), historial de comandos con las flechas `↑` y `↓`, autocompletado básico con `Tab`, comando `clear` y atajos de copia automática.
* 🌲 **Árbol de Directorios Virtual en Tiempo Real (VFS):** Representación visual interactiva que muestra de forma gráfica la ubicación actual (`📍 ana está aquí`), carpetas, archivos y archivos ocultos (`.*`) actualizándose instantáneamente al ejecutar comandos.
* 🛡 **Modo Seguro Anti-Ansiedad:** Interceptor pedagógico para comandos destructivos (`rm`). Ante cualquier intento de borrado, la terminal pausa la acción y solicita confirmación `⚠ [s/N]`, además de bloquear de forma educativa comandos críticos en la vida real (como `rm -rf /` o `rm -rf *`).
* 🤖 **Tutor Socrático e Inteligencia Artificial Integrada (Gemini API):**
  * **Comando `ai` en consola:** Escribe `ai <tu duda>` directamente en la terminal para recibir orientación del tutor en tiempo real.
  * **Anatomía y Traductor NL2Bash (JSON Estructurado):** Traduce instrucciones en lenguaje natural a comandos de Linux y desglosa sus piezas (comando, opciones, argumentos) con analogías visuales y niveles de riesgo.
  * **Generador de Preguntas y Progreso:** Diagnóstico adaptable e informe personalizado de avance.
* 📚 **Currículo Curricular Completo (P0 a P8):**
  * **Módulo 0:** Introducción y Cuestionario Diagnóstico inicial interactivo con 5 preguntas de opción múltiple.
  * **Ruta 1 (Supervivencia básica):** `pwd`, `cd`, `ls -la`, `cat`, `less`, `head`, `tail` + *Reto 1: Búsqueda del tesoro*.
  * **Ruta 2 (Manipulación segura):** `mkdir -p`, `touch`, `cp`, `mv`, `rm -i`, `rmdir`, comodines `*` y `?` + *Reto 2: Ordena la carpeta descargas*.
  * **Ruta 3 (Búsqueda y flujo de datos):** `find`, `grep`, tuberías `|`, redirecciones `>` y `>>` + *Reto 3: Auditoría de registros del servidor*.
  * **Glosario (`man`):** Fichas de consulta rápida para 18 comandos y operadores con buscador en tiempo real.
* 💾 **Persistencia Local (`localStorage`):** Todo el progreso del estudiante (lecciones superadas, rutas desbloqueadas e insignias ganadas) se guarda automáticamente en el navegador, incluyendo tarjetas de repaso / chuletas descargables en formato `.md`.

---

## 🛠️ Stack Tecnológico

* **Frontend:** React 19 con Hooks (`useState`, `useEffect`, `useRef`, `useMemo`).
* **Estilos:** Tailwind CSS (diseño responsivo adaptado a escritorios con vistas divididas y móviles con acordeones).
* **Iconografía:** `lucide-react`.
* **Empaquetador y Despliegue:** Vite 7 + GitHub Actions / GitHub Pages.
* **Motor Lógico:** Intérprete Bash simulado en JavaScript puro con soporte para tuberías (`|`), redirecciones (`>`, `>>`), expansión de comodines y rutas relativas/absolutas.

---

## 🚀 Despliegue en Vivo

Puedes acceder a la plataforma interactiva desplegada en producción a través de GitHub Pages:
👉 **[https://luisangelaraujo.github.io/linuxlab/](https://luisangelaraujo.github.io/linuxlab/)**

---

## 👥 Autor

Desarrollado como proyecto de Recursos Educativos Digitales e Ingeniería de Software.
