import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import type { CategoryRow } from '../types.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();
router.use(authenticate);

const categorySchema = z.object({
  name: z.string().min(1, 'Введите название').max(100),
  icon: z.string().min(1).max(50).default('tag'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Некорректный цвет')
    .default('#8b5cf6'),
});

function serialize(c: CategoryRow) {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    isGlobal: c.is_global,
    ownedByUser: c.user_id !== null ? undefined : false,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query<CategoryRow>(
      `SELECT * FROM categories WHERE is_global = TRUE OR user_id = $1
       ORDER BY is_global DESC, name ASC`,
      [req.user.id],
    );
    const userRows = rows.filter((r) => !r.is_global);
    const globalRows = rows.filter((r) => r.is_global);
    res.json({ categories: [...globalRows, ...userRows].map(serialize) });
  }),
);

router.post(
  '/',
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const { rows } = await query<CategoryRow>(
      `INSERT INTO categories (user_id, name, icon, color)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, req.body.name, req.body.icon, req.body.color],
    );
    res.status(201).json({ category: serialize(rows[0]) });
  }),
);

router.put(
  '/:id',
  validate(categorySchema),
  asyncHandler(async (req, res) => {
    const { rows } = await query<CategoryRow>(
      'SELECT * FROM categories WHERE id = $1',
      [req.params.id],
    );
    const cat = rows[0];
    if (!cat) throw new HttpError(404, 'Категория не найдена');
    if (cat.is_global) throw new HttpError(403, 'Глобальные категории нельзя редактировать');
    if (cat.user_id !== req.user.id) throw new HttpError(403, 'Нет доступа');

    const updated = await query<CategoryRow>(
      'UPDATE categories SET name = $1, icon = $2, color = $3 WHERE id = $4 RETURNING *',
      [req.body.name, req.body.icon, req.body.color, req.params.id],
    );
    res.json({ category: serialize(updated.rows[0]) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query<CategoryRow>(
      'SELECT * FROM categories WHERE id = $1',
      [req.params.id],
    );
    const cat = rows[0];
    if (!cat) throw new HttpError(404, 'Категория не найдена');
    if (cat.is_global) throw new HttpError(403, 'Глобальные категории нельзя удалять');
    if (cat.user_id !== req.user.id) throw new HttpError(403, 'Нет доступа');

    await query('UPDATE habits SET category_id = NULL WHERE category_id = $1', [cat.id]);
    await query('DELETE FROM categories WHERE id = $1', [cat.id]);
    res.json({ ok: true });
  }),
);

export default router;