const fs = require('fs');
let authStr = fs.readFileSync('nexus-backend/src/routes/auth.ts', 'utf8');
authStr = authStr.replace(/const userId = req.user\?\.id \|\| req.user\?\.userId;/g, 'const userId = req.user?.userId || (req.user as any)?.id;');
fs.writeFileSync('nexus-backend/src/routes/auth.ts', authStr);
