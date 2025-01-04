import express from 'express';
import routes from './routes/index';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use('/', routes);
app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
