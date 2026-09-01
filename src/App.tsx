import { Button, Card } from './components';
import './index.css';

function App() {
  return (
    <main className="app">
      <header className="app__header">
        <p className="app__eyebrow">Component library</p>
        <h1>BHHC Storybook</h1>
        <p>
          Sample React + TypeScript components. Open Storybook for docs,
          stories, and the versioned changelog.
        </p>
        <Button
          label="Open Storybook"
          onClick={() => {
            window.open('http://localhost:6006', '_blank');
          }}
        />
      </header>

      <section className="app__grid" aria-label="Sample components">
        <Card
          eyebrow="Components"
          title="Button"
          description="Primary and secondary actions with small, medium, and large sizes."
        />
        <Card
          eyebrow="Components"
          title="Card"
          description="Group a title and short description. Add an eyebrow for status or category."
        />
      </section>
    </main>
  );
}

export default App;
