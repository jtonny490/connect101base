import express from 'express';
import cors from 'cors';
import dealRoutes from './dealRoutes.js';
import milestoneRoutes from './milestoneRoutes.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());
app.use(dealRoutes);
app.use(milestoneRoutes);

app.listen(port, () => {
  console.log(`DealLock backend listening at http://localhost:${port}`);
});
