import { PhaserGame } from './game/PhaserGame'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <p className="brand-name">Sandspire</p>
            <p className="brand-sub">Isometric Desert City</p>
          </div>
        </div>
        <p className="hint">Перетаскивайте карту · Колесо — масштаб</p>
      </header>
      <main className="stage">
        <PhaserGame />
      </main>
    </div>
  )
}

export default App
