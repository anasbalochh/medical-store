import app from './index';

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`[api] listening on http://localhost:${port}`));
