// Resolves a file in /public against the build's base path, so the page keeps
// working if it is served from a sub-path (e.g. the MM minis host). Never
// hardcode "/media/..." for public files: route them through asset().
export function asset(path: string) {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, "");
}
