import { CardContent, CssBaseline, ThemeProvider, Typography } from '@mui/material';

import { Button, Card } from '../components';
import { theme } from '../theme';

import './index.css';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <main className="app">
        <header className="app__header">
          <p className="app__eyebrow">Component library</p>
          <h1>BHHC design system</h1>
          <p>
            MUI Material, Core, and X replacement package. Open Storybook for docs, stories, and the
            versioned changelog.
          </p>
          <Button
            variant="contained"
            onClick={() => {
              window.open('http://localhost:6006', '_blank');
            }}
          >
            Open Storybook
          </Button>
        </header>

        <section className="app__grid" aria-label="Sample components">
          <Card sx={{ maxWidth: 320 }}>
            <CardContent>
              <Typography variant="overline" color="primary">
                Components
              </Typography>
              <Typography gutterBottom variant="h6" component="h3">
                Button
              </Typography>
              <Typography variant="body2" color="text.secondary">
                MUI Button with BHHC theme defaults for contained, outlined, and text variants.
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ maxWidth: 320 }}>
            <CardContent>
              <Typography variant="overline" color="primary">
                Components
              </Typography>
              <Typography gutterBottom variant="h6" component="h3">
                Card
              </Typography>
              <Typography variant="body2" color="text.secondary">
                MUI Card with BHHC radius and border. Compose with CardContent and Typography.
              </Typography>
            </CardContent>
          </Card>
        </section>
      </main>
    </ThemeProvider>
  );
}
