import mongoose, { type Model, type Schema } from 'mongoose';

/** The paths a schema defines — a cheap stand-in for comparing two schemas. */
const shapeOf = (schema: Schema) => Object.keys(schema.paths).sort().join(',');

/**
 * Register a model once, without letting a running dev server keep an old schema.
 *
 * `mongoose.models.product || mongoose.model('product', schema)` is the standard
 * guard against compiling a model twice, and it is also what makes a schema change
 * invisible: the module graph is re-evaluated with the new schema, the registry
 * hands back the model built from the previous one, and every path the change added
 * is silently dropped on write. Reads look fine because `.lean()` returns the stored
 * document as it is — so the failure reads as "I saved it and nothing happened".
 *
 * In development the two schemas can differ, so the stale model is replaced. In a
 * production process the registry is always built from the shipped schema, so the
 * cached model is simply returned and nothing is deleted.
 */
export function registerModel<T>(name: string, schema: Schema<T>): Model<T> {
  const cached = mongoose.models[name] as Model<T> | undefined;
  if (!cached) return mongoose.model<T>(name, schema);

  if (process.env.NODE_ENV !== 'development' || shapeOf(cached.schema) === shapeOf(schema)) return cached;

  mongoose.deleteModel(name);
  return mongoose.model<T>(name, schema);
}
