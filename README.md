# Sandspire — React + Phaser Desert City

Изометрический пустынный город на **React 19** и **Phaser 4**, собранный из модульных ассетов (ворота, стены, башни, дома, базар, фонтан, тайлы).

## Запуск

```bash
npm install
npm run dev
```

## Управление

- **ЛКМ + drag** — панорама
- **Колесо мыши** — масштаб

## Структура

- `src/game/scenes/CityScene.ts` — сцена города
- `src/game/cityLayout.ts` — раскладка объектов на изометрической сетке
- `public/assets/sprites/` — нарезанные спрайты
- `public/assets/spritesheet.png` — исходный лист ассетов
