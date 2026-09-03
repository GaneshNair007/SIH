import fs from 'fs';
import path from 'path';

const SRC_APP_DIR = path.resolve('src/app');

function scanDir(dir, baseRoute = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(scanDir(fullPath, `${baseRoute}/${file}`));
    } else if (file === 'page.tsx' || file === 'route.ts' || file === 'layout.tsx' || file === 'not-found.tsx') {
      results.push(fullPath);
    }
  }
  return results;
}

const files = scanDir(SRC_APP_DIR);
const audits = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative(SRC_APP_DIR, filePath).replace(/\\/g, '/');
  const route = '/' + relPath.replace(/\/page\.tsx$/, '').replace(/\/route\.ts$/, '').replace(/^page\.tsx$/, '');
  const isApi = filePath.endsWith('route.ts');
  const isPage = filePath.endsWith('page.tsx');

  const hasUseClient = content.trim().startsWith('"use client"') || content.trim().startsWith("'use client'");
  
  const clientHooks = ['useState', 'useEffect', 'useRouter', 'useSearchParams', 'useParams', 'useAuth', 'useQuery', 'usePathname', 'useContext'];
  const detectedHooks = clientHooks.filter(hook => new RegExp(`\\b${hook}\\b`).test(content));

  const browserGlobals = ['window\\.', 'document\\.', 'sessionStorage\\.', 'localStorage\\.', 'navigator\\.'];
  const detectedGlobals = browserGlobals.filter(g => new RegExp(g).test(content));

  const usesSearchParams = content.includes('useSearchParams');
  const hasSuspense = content.includes('<Suspense') || content.includes('Suspense');

  const issues = [];

  if (isPage && !hasUseClient && detectedHooks.length > 0) {
    issues.push(`Page uses client hooks (${detectedHooks.join(', ')}) but missing 'use client' directive.`);
  }

  if (usesSearchParams && !hasSuspense) {
    issues.push(`Page uses 'useSearchParams' but is not wrapped in <Suspense>, which can cause de-optimization or build failure.`);
  }

  audits.push({
    route: route || '/',
    filePath: relPath,
    type: isApi ? 'api' : isPage ? 'page' : 'layout/other',
    hasUseClient,
    usesClientHooks: detectedHooks,
    usesBrowserGlobalsInBody: detectedGlobals,
    hasSuspenseForSearchParams: usesSearchParams ? hasSuspense : true,
    issues
  });
}

console.log(JSON.stringify(audits, null, 2));
