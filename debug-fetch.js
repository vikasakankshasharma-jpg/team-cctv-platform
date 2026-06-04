const fs = require('fs');

const path = 'app/(admin)/admin/catalog-manager/CatalogManagerClient.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const fetchProducts = async () => {',
  'const fetchProducts = async () => { console.log("fetchProducts started");'
);

content = content.replace(
  'const res = await fetch("/api/admin/products");',
  'console.log("fetching from API..."); const res = await fetch("/api/admin/products"); console.log("API response status:", res.status);'
);

content = content.replace(
  '} catch (error) {',
  '} catch (error) { console.error("fetchProducts caught error:", error);'
);

content = content.replace(
  '} finally {',
  '} finally { console.log("fetchProducts finally block");'
);

fs.writeFileSync(path, content);
console.log("Injected console logs into CatalogManagerClient");
