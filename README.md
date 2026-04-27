# coda
PWA for creating, viewing and sharing song chords with lyrics

## Setup

### Firebase

This app uses [Firebase](https://firebase.google.com/) for authentication and data storage.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Firestore Database** in the Firebase console.
3. Enable **Google** as a sign-in provider under **Authentication → Sign-in method**.
4. Copy `.env.example` to `.env.local` and fill in your Firebase project credentials (found under **Project Settings → Your apps**).

### Firestore rules

Firestore security rules are versioned in `firestore.rules` and referenced by `firebase.json`.

Deploy them with Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

## Service Worker

La aplicación usa un Service Worker definido en `src/sw.js` y empaquetado por `vite-plugin-pwa` con estrategia `injectManifest`.

### Cómo se registra

La configuración está en `vite.config.js`:

- `srcDir: 'src'`
- `filename: 'sw.js'`
- `strategies: 'injectManifest'`
- `registerType: 'autoUpdate'`

Esto hace que Vite genere el Service Worker a partir de `src/sw.js` e inyecte el manifiesto de assets precacheados en `self.__WB_MANIFEST` durante el build.

### Qué hace el Service Worker

El archivo `src/sw.js` cumple dos funciones principales:

1. Precacha los assets estáticos de la app con Workbox.
2. Descarga y mantiene en IndexedDB el catálogo de acordes para que la aplicación pueda leerlo de forma rápida y con soporte offline parcial.

#### Precaching

Al iniciar, el Service Worker ejecuta:

- `precacheAndRoute(self.__WB_MANIFEST)` para servir los archivos generados por el build desde caché.
- `cleanupOutdatedCaches()` para limpiar versiones viejas de esos caches.

#### Ciclo de vida

- En `install`, ejecuta `skipWaiting()` para que la nueva versión pueda activarse sin esperar un cierre completo de pestañas.
- En `activate`, ejecuta `clients.claim()` para tomar control inmediato de las páginas abiertas.

Durante `activate` también arranca la sincronización de acordes:

- Intenta primero una carga inicial desde `/chords.json`.
- Si falla, registra un Background Sync con la etiqueta `sync-chords-cache-initial`.
- En paralelo, agenda una sincronización más completa desde `/chords.complete.json` usando la etiqueta `sync-chords-cache-complete`.

Si el navegador no soporta Background Sync, la sincronización completa se intenta igualmente como operación best-effort.

#### Persistencia en IndexedDB

El Service Worker guarda los acordes en IndexedDB usando:

- Base: `coda-db`
- Object store: `app-cache`
- Clave: `chords`

Cada sincronización descarga un JSON desde la red y sobrescribe el valor almacenado bajo esa clave.

### Cómo lo usa la aplicación

El consumidor principal es `src/services/chords.js`.

Ese servicio sigue este flujo:

1. Antes de cargar acordes, intenta detectar si hay una sincronización del Service Worker en curso.
2. Si existe un worker activo o controlador, envía un mensaje `CHORDS_SYNC_WAIT` por `MessageChannel`.
3. El Service Worker responde cuando la sincronización inicial en curso termina, o cuando vence el timeout del lado cliente.
4. Luego `src/services/chords.js` intenta leer los acordes desde IndexedDB.
5. Si no encuentra datos, hace fallback a `fetch('/chords.json')` y guarda el resultado en IndexedDB.

Este mecanismo evita que la app lea IndexedDB demasiado pronto mientras el Service Worker todavía está poblando la caché de acordes.

### Eventos y mensajes relevantes

En `src/sw.js` se usan estos puntos de coordinación:

- Evento `activate`: dispara la sincronización inicial.
- Evento `sync`: reintenta sincronizaciones pendientes cuando el navegador lo permite.
- Evento `message`: escucha `CHORDS_SYNC_WAIT` y responde por `MessagePort`.

En `src/services/chords.js`:

- `waitForServiceWorkerSyncIfRunning()` espera la sincronización inicial.
- `loadChords()` prioriza IndexedDB y solo usa red como fallback.
- `getAllChordNames()` y `getChordShapes()` consumen ese caché ya cargado.

### Resumen del flujo

1. La app se construye con VitePWA y genera el Service Worker desde `src/sw.js`.
2. El Service Worker se activa, toma control de la página y empieza a sincronizar acordes.
3. Los acordes se guardan en IndexedDB.
4. `src/services/chords.js` espera, cuando hace falta, a que esa sincronización termine.
5. La UI consume los acordes desde IndexedDB o desde red si todavía no hay caché disponible.

