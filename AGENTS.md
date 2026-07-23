# Sandspire — React + Phaser Desert City

Однопакетное фронтенд-приложение (Vite + React 19 + Phaser 4 + TypeScript), рендерит изометрический пустынный город на canvas. Бэкенда, базы данных и переменных окружения нет.

## Cursor Cloud specific instructions

- Единственный сервис — фронтенд Vite. Стандартные команды описаны в `package.json` (`dev`, `build`, `lint`, `preview`) и `README.md`; используйте их, не дублируя.
- Зависимости (`npm install`) ставятся update-скриптом при старте VM, вручную повторять не нужно.
- Dev-сервер: `npm run dev -- --host` слушает на `http://localhost:5173/`. Флаг `--host` нужен, чтобы порт был доступен извне песочницы для ручного тестирования в браузере.
- Lint (`npm run lint`, oxlint) и build (`npm run build`, `tsc -b && vite build`) проходят без ошибок. Автоматических тестов (unit/e2e) в репозитории нет.
- Build выводит предупреждение о размере чанка (Phaser в одном бандле > 500 kB) — это ожидаемо и не является ошибкой.
- Ассеты города лежат в `public/assets/` (спрайты, `catalog.json`, `manifest.json`) и отдаются Vite статикой.
- Управление в приложении: ЛКМ + drag — панорама, колесо мыши — масштаб.
