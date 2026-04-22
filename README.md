# La Casita de los Ratones

Juego web educativo del Raton Perez, ahora organizado en estructura modular para facilitar mantenimiento y contribuciones.

## Estructura

- index.html: entrada principal de la app
- assets/css/main.css: estilos globales
- assets/js/data/ratones.js: catalogo de personajes
- assets/js/state/appState.js: estado compartido
- assets/js/ui/playerSelection.js: pantalla de seleccion de jugadores
- assets/js/ui/gameScreen.js: pantalla de juego y acciones base
- assets/js/main.js: bootstrap de la app

## Ejecutar localmente

Opciones simples:

1. Usar Live Server en VS Code.
2. O usar servidor local para modulos ES:

```powershell
cd d:\Repos\raton-perez
python -m http.server 5500
```

Luego abrir <http://localhost:5500>.

Nota: al abrir con file:// los imports de modulos se bloquean por seguridad del navegador.

## Publicar en GitHub Pages

El repo incluye workflow en .github/workflows/deploy-pages.yml.

Pasos:

1. Crear repo en GitHub.
2. Subir este proyecto a la rama main.
3. En Settings > Pages, source: GitHub Actions.
4. Al hacer push en main se desplegara automaticamente.

## Roadmap sugerido

- Migrar la logica completa del tablero multiplayer al modulo gameScreen.
- Agregar tests de UI con Playwright.
- Persistir partidas y ranking en localStorage.

## Licencia

MIT. Ver LICENSE.
