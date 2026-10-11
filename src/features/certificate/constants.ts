/**
 * Certificates the generated résumé sheet carries.
 *
 * The sheet is a fixed A4 page and every section on it competes for the same
 * vertical space, so credentials are bounded here the way roles, projects and
 * study records are bounded in `build.ts`. The public section lists all of them;
 * only this many are promoted to print.
 */
export const MAX_RESUME_CERTIFICATES = 4;
